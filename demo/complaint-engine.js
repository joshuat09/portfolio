/*
 * Rule-based simulation of a bounded-autonomy complaint agent.
 * The "agent" proposes tool calls; a tool registry validates them and a deterministic
 * safety gate decides whether terminal actions may run. No network, no LLM.
 */
(function (root) {
  'use strict';

  const D = root.ComplaintData || (typeof require === 'function' ? require('./complaint-data.js') : null);
  const MAX_CALLS = 8;

  const INTENTS = {
    late_delivery: { label: 'Late delivery', words: ['late', 'delayed', 'hasn\'t arrived', 'hasnt arrived', 'not arrived', 'never arrived', 'turned up', 'still waiting', 'where is', 'missing parcel', 'overdue'] },
    damaged_item: { label: 'Damaged or faulty item', words: ['damaged', 'broken', 'smashed', 'cracked', 'faulty', 'defective', 'stopped working', 'not working', 'arrived broken'] },
    wrong_item: { label: 'Wrong item', words: ['wrong item', 'wrong product', 'incorrect item', 'not what i ordered', 'different item'] },
    billing_error: { label: 'Billing error', words: ['charged twice', 'double charged', 'overcharged', 'billing', 'charged me', 'wrong amount', 'direct debit'] },
    poor_service: { label: 'Poor service', words: ['rude', 'terrible service', 'service is terrible', 'nobody helps', 'nobody ever helps', 'unhelpful', 'ignored', 'no one replied'] }
  };
  const REFUND_WORDS = ['refund', 'money back', 'reimburse', 'chargeback'];
  const LEGAL_WORDS = ['solicitor', 'lawyer', 'legal action', 'sue ', 'court', 'trading standards', 'small claims', 'ombudsman'];
  const VULNERABLE_WORDS = ['can\'t afford', 'cannot afford', 'struggling', 'vulnerable', 'disabled', 'disability', 'bereavement', 'passed away', 'mental health', 'in hospital', 'elderly'];
  const NEGATIVE_WORDS = ['terrible', 'awful', 'angry', 'furious', 'frustrated', 'disgusted', 'useless', 'worst', 'unacceptable', 'ridiculous'];

  const count = (text, words) => words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0);

  function interpret(text) {
    const t = ' ' + text.toLowerCase() + ' ';
    let intent = 'unclear', best = 0;
    Object.keys(INTENTS).forEach(key => {
      const score = count(t, INTENTS[key].words);
      if (score > best) { best = score; intent = key; }
    });
    const idMatch = text.match(/\bORD-\d{4}\b/i);
    const negative = count(t, NEGATIVE_WORDS);
    return {
      intent,
      intentLabel: intent === 'unclear' ? 'Unclear' : INTENTS[intent].label,
      orderId: idMatch ? idMatch[0].toUpperCase() : null,
      wantsRefund: count(t, REFUND_WORDS) > 0,
      sentiment: negative >= 2 ? 'very negative' : negative === 1 ? 'negative' : 'neutral',
      flags: { legal: count(t, LEGAL_WORDS) > 0, vulnerable: count(t, VULNERABLE_WORDS) > 0 }
    };
  }

  /* ---- Tool registry: name -> argument schema + implementation ---- */
  const TOOLS = {
    lookup_order: {
      args: { order_id: 'string' },
      run: a => {
        const o = D.orders[a.order_id];
        return o ? { found: true, order: o } : { found: false };
      }
    },
    lookup_customer: {
      args: { customer_id: 'string' },
      run: a => {
        const c = D.customers[a.customer_id];
        return c ? { found: true, customer: c } : { found: false };
      }
    },
    check_policy: {
      args: { intent: 'string', order_id: 'string', wants_refund: 'boolean' },
      run: a => checkPolicy(a)
    },
    request_missing_info: { args: { fields: 'array' }, run: a => ({ requested: a.fields }) },
    escalate_to_human: {
      args: { reason: 'string', priority: 'string' },
      run: a => ({ ticket: 'ESC-' + (1000 + hash(a.reason) % 9000), queue: a.priority === 'high' ? 'Priority review' : 'Standard review' })
    },
    resolve_case: { args: { action: 'string', order_id: 'string' }, run: a => ({ status: 'done', action: a.action }) }
  };
  const TERMINAL = ['request_missing_info', 'escalate_to_human', 'resolve_case'];

  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

  function checkPolicy(a) {
    const o = D.orders[a.order_id];
    const P = D.policy;
    if (a.intent === 'billing_error') return { remedy: 'billing_review', note: 'Billing corrections are financial actions and need a human.' };
    if (a.intent === 'poor_service') return { remedy: 'service_review', note: 'Complaints about service quality need a human to respond.' };
    if (a.intent === 'unclear') return { remedy: 'unclear', note: 'No recognisable issue in the message.' };
    const delivered = o.status === 'delivered';
    const age = delivered ? o.deliveredDaysAgo : 0;
    if (a.wants_refund) {
      return delivered && age <= P.returnWindowDays
        ? { remedy: 'refund_review', note: `Delivered ${age}d ago, inside the ${P.returnWindowDays}-day window. Refunds need human approval.` }
        : { remedy: 'decline_review', note: `Delivered ${age}d ago, outside the ${P.returnWindowDays}-day window. Declining a refund needs human sign-off.` };
    }
    if (a.intent === 'late_delivery') {
      if (delivered) return { remedy: 'delivery_dispute_review', note: 'System shows delivered; a lost-parcel investigation needs a human.' };
      return { remedy: 'tracking_update', note: `Due ${o.dueDaysAgo}d ago and still in transit with ${o.carrier}.` };
    }
    if (a.intent === 'damaged_item' || a.intent === 'wrong_item') {
      return delivered && age <= P.returnWindowDays
        ? { remedy: 'replacement', note: `Delivered ${age}d ago, inside the return window.` }
        : { remedy: 'decline_review', note: `Outside the ${P.returnWindowDays}-day window.` };
    }
    return { remedy: 'unclear', note: 'No matching policy.' };
  }

  function validateCall(call) {
    const tool = TOOLS[call.name];
    if (!tool) return { ok: false, error: `Unknown tool "${call.name}" - not in the registry of ${Object.keys(TOOLS).length} tools.` };
    const expected = Object.keys(tool.args);
    for (const key of expected) {
      const v = call.args[key];
      const type = tool.args[key];
      const good = type === 'array' ? Array.isArray(v) : typeof v === type;
      if (!good) return { ok: false, error: `Argument "${key}" must be ${type}.` };
    }
    const extra = Object.keys(call.args).filter(k => !(k in tool.args));
    if (extra.length) return { ok: false, error: `Unexpected argument "${extra[0]}".` };
    return { ok: true };
  }

  /* ---- Deterministic safety gate for terminal actions ---- */
  function gate(call, s) {
    if (call.name !== 'resolve_case') return { allow: true };
    if (s.flags.legal) return { allow: false, rule: 'G1', message: 'Legal language detected. Automated resolution is not permitted.', priority: 'high' };
    if (s.flags.vulnerable) return { allow: false, rule: 'G2', message: 'Customer may be vulnerable. A human must handle this case.', priority: 'high' };
    if (D.policy.allowedResolveActions.indexOf(call.args.action) === -1) return { allow: false, rule: 'G3', message: `Action "${call.args.action}" is not on the allowed list.`, priority: 'normal' };
    if (call.args.action === 'arrange_replacement' && s.order.value > D.policy.autoReplacementMaxValue) {
      return { allow: false, rule: 'G4', message: `Replacement value £${s.order.value.toFixed(2)} exceeds the £${D.policy.autoReplacementMaxValue} automatic limit.`, priority: 'normal' };
    }
    return { allow: true };
  }

  /* ---- The "agent": proposes the next call from what it knows so far ---- */
  function nextCall(s) {
    const i = s.interp;
    if (s.stress && !s.injected) {
      s.injected = true;
      return { name: 'issue_refund', args: { order_id: i.orderId || 'unknown', amount: s.order ? s.order.value : 0 } };
    }
    if (s.gateBlock) {
      const b = s.gateBlock; s.gateBlock = null;
      return { name: 'escalate_to_human', args: { reason: `[${b.rule}] ${b.message}`, priority: b.priority } };
    }
    if (i.orderId && !s.orderChecked) { s.orderChecked = true; return { name: 'lookup_order', args: { order_id: i.orderId } }; }
    if (s.order && !s.customerChecked) { s.customerChecked = true; return { name: 'lookup_customer', args: { customer_id: s.order.customerId } }; }
    if (!s.order) {
      if (s.flags.legal || s.flags.vulnerable) return { name: 'escalate_to_human', args: { reason: 'Sensitive message with no verifiable order.', priority: 'high' } };
      const fields = i.orderId ? ['valid_order_number'] : (i.intent === 'unclear' || i.intent === 'poor_service' ? ['order_number', 'issue_description'] : ['order_number']);
      return { name: 'request_missing_info', args: { fields } };
    }
    if (!s.policy) return { name: 'check_policy', args: { intent: i.intent, order_id: s.order.id, wants_refund: i.wantsRefund } };
    const remedy = s.policy.remedy;
    const resolveWith = action => ({ name: 'resolve_case', args: { action, order_id: s.order.id } });
    if (remedy === 'tracking_update') return resolveWith('send_tracking_update');
    if (remedy === 'replacement') return resolveWith('arrange_replacement');
    const priority = (s.flags.legal || s.flags.vulnerable) ? 'high' : 'normal';
    return { name: 'escalate_to_human', args: { reason: s.policy.note, priority } };
  }

  const money = n => '£' + n.toFixed(2);
  const short = obj => JSON.stringify(obj);

  function run(text, opts) {
    const interp = interpret(text);
    const s = { interp, flags: Object.assign({}, interp.flags), stress: !!(opts && opts.stress), steps: [], calls: 0, done: false };
    const add = (kind, status, title, detail) => s.steps.push({ kind, status, title, detail: detail || '' });

    add('interpret', 'info', 'Interpreted complaint',
      `Intent: ${interp.intentLabel} · Order: ${interp.orderId || 'none found'} · Sentiment: ${interp.sentiment}` +
      (interp.wantsRefund ? ' · Customer asks for a refund' : '') +
      (interp.flags.legal ? ' · LEGAL language' : '') + (interp.flags.vulnerable ? ' · VULNERABILITY cues' : ''));

    let final = null;
    while (!s.done) {
      if (s.calls >= MAX_CALLS) {
        add('gate', 'blocked', 'Iteration limit reached', `Stopped after ${MAX_CALLS} tool calls and escalated.`);
        final = { name: 'escalate_to_human', args: { reason: 'Iteration limit reached.', priority: 'normal' }, result: TOOLS.escalate_to_human.run({ reason: 'Iteration limit reached.', priority: 'normal' }) };
        break;
      }
      const call = nextCall(s);
      s.calls++;
      add('propose', 'info', `Agent proposes ${call.name}`, short(call.args));

      const v = validateCall(call);
      if (!v.ok) { add('registry', 'blocked', 'Rejected by tool registry', v.error); continue; }

      if (TERMINAL.indexOf(call.name) !== -1) {
        const g = gate(call, s);
        if (!g.allow) {
          add('gate', 'blocked', `Safety gate blocked (${g.rule})`, g.message);
          s.gateBlock = g;
          continue;
        }
        add('gate', 'ok', 'Safety gate passed', 'No rule prevents this action.');
      }

      const result = TOOLS[call.name].run(call.args);
      add('tool', 'ok', `${call.name} returned`, short(result));
      if (call.name === 'lookup_order' && result.found) s.order = result.order;
      if (call.name === 'lookup_customer' && result.found) { s.customer = result.customer; if (result.customer.vulnerable) { s.flags.vulnerable = true; add('interpret', 'info', 'Customer record flagged', 'Account carries a vulnerability marker.'); } }
      if (call.name === 'check_policy') s.policy = result;
      if (TERMINAL.indexOf(call.name) !== -1) { s.done = true; final = { name: call.name, args: call.args, result }; }
    }

    const outcome = buildOutcome(final, s);
    add('decision', outcome.type === 'resolve' ? 'ok' : 'info', 'Decision: ' + outcome.label, outcome.summary);
    return { interp, steps: s.steps, outcome };
  }

  function buildOutcome(final, s) {
    const name = s.customer ? s.customer.name.split(' ')[0] : null;
    const hi = name ? `Hi ${name},` : 'Hello,';
    const o = s.order;
    if (final.name === 'resolve_case') {
      const a = final.args.action;
      const body = a === 'send_tracking_update'
        ? `I'm sorry your ${o.item} (${o.id}) is ${o.dueDaysAgo} days past its due date. It is still with ${o.carrier}; I've requested a fresh delivery estimate and we'll email you as soon as it moves.`
        : `I'm sorry your ${o.item} (${o.id}) wasn't right. A replacement has been arranged and you'll get a dispatch email with tracking shortly.`;
      return { type: 'resolve', label: 'RESOLVE', summary: `Automated action "${a}" approved by the safety gate.`, reply: `${hi}\n\n${body}\n\nKind regards,\nCustomer Care`, reasons: [s.policy.note, 'Within automatic limits and no risk flags.'] };
    }
    if (final.name === 'request_missing_info') {
      const asks = { order_number: 'your order number (e.g. ORD-1234)', valid_order_number: 'a valid order number - we couldn\'t find the one you gave', issue_description: 'a short description of what went wrong' };
      const list = final.args.fields.map(f => '- ' + (asks[f] || f)).join('\n');
      return { type: 'more_info', label: 'MORE INFO', summary: 'Not enough verified information to act safely.', reply: `${hi}\n\nThanks for getting in touch, and sorry for the trouble. To look into this, could you send us:\n${list}\n\nKind regards,\nCustomer Care`, reasons: ['No verifiable order on file for this message.'] };
    }
    const ticket = final.result.ticket;
    const reasons = [final.args.reason];
    if (o) reasons.push(`Order ${o.id}: ${o.item}, ${money(o.value)}.`);
    return { type: 'human', label: 'HUMAN REVIEW', summary: `Escalated to ${final.result.queue} as ${ticket}.`, reply: `${hi}\n\nThank you for your message - I'm sorry for the problem. I've passed your case to a colleague who will review it personally. Your reference is ${ticket}, so you won't need to repeat yourself.\n\nKind regards,\nCustomer Care`, reasons };
  }

  const api = { run, interpret, validateCall, gate, MAX_CALLS, toolNames: Object.keys(TOOLS) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ComplaintEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);

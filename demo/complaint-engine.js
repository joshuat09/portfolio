/*
 * Browser port of the Python complaint agent's control flow (agent/core.py, agent/safety.py, tools/).
 * Ported from the real code: the intake safety screen, the four read-only tools and their validation,
 * the bounded loop (8 model calls), escalation on every failure path, and the escalation record.
 * Not ported: the language model. A scripted stand-in chooses each step instead of qwen3:4b.
 */
(function (root) {
  'use strict';

  const D = root.ComplaintData || (typeof require === 'function' ? require('./complaint-data.js') : null);

  /* ---- Deterministic intake screening (agent/safety.py) ---- */
  function assessComplaint(text, opts) {
    const o = opts || {};
    const t = text.toLowerCase();
    const has = list => list.some(term => t.indexOf(term) !== -1);
    const flags = [];
    if (o.requestedAmount != null && o.requestedAmount >= D.safety.highValueThreshold) flags.push('high_value');
    if (has(D.safety.moneyTransferTerms)) flags.push('money_transfer_request');
    if (has(D.safety.suspiciousTerms)) flags.push('suspicious_request');
    if (o.outsidePolicy || has(D.safety.outOfPolicyTerms)) flags.push('outside_policy');
    if (o.ambiguous) flags.push('ambiguous');
    return { flags, escalate: flags.length > 0 };
  }

  /* ---- Read-only tools (tools/*.py) and validation (_execute_tool) ---- */
  function lookup(table, id, kind) {
    const rec = table[id];
    return rec
      ? Object.assign({}, rec, { found: true, record: rec, error: null })
      : { found: false, record: null, error: { code: 'not_found', message: `${kind} '${id}' was not found.` } };
  }
  const TOOLS = {
    get_customer: { arg: 'customer_id', run: a => lookup(D.customers, a.customer_id, 'Customer') },
    get_order: { arg: 'order_id', run: a => lookup(D.orders, a.order_id, 'Order') },
    get_policy: { arg: 'policy_id', run: a => lookup(D.policies, a.policy_id, 'Policy') },
    list_policies: { arg: null, run: () => Object.keys(D.policies).map(k => D.policies[k]) }
  };

  function ToolValidationError(message) { this.message = message; this.name = 'ToolValidationError'; }

  function executeTool(call) {
    const spec = TOOLS[call.name];
    if (!spec) throw new ToolValidationError('Unknown tool: ' + call.name);
    const expected = spec.arg ? [spec.arg] : [];
    const keys = Object.keys(call.arguments);
    if (keys.length !== expected.length || keys.some(k => expected.indexOf(k) === -1)) {
      throw new ToolValidationError(`Invalid arguments for ${call.name}; expected ${JSON.stringify(expected)}`);
    }
    if (spec.arg) {
      const v = call.arguments[spec.arg];
      if (typeof v !== 'string' || !v.trim()) throw new ToolValidationError(`${spec.arg} must be a non-empty string`);
    }
    return spec.run(call.arguments);
  }

  /* ---- Stand-in for the language model: scripted next-step rules ---- */
  function extractIds(text) {
    const ord = text.match(/\bORD-\d{4}\b/i);
    let orderId = ord ? ord[0].toUpperCase() : null;
    if (!orderId) {
      const m = text.match(/\border(?:\s+number)?(?:\s+is)?\s+#?(\d{3,6})\b/i);
      if (m) orderId = m[1];
    }
    const cust = text.match(/\bCUST-\d{4}\b/i);
    return { orderId, customerId: cust ? cust[0].toUpperCase() : null };
  }

  function standInModel(text, toolCalls, ids) {
    const t = text.toLowerCase();
    const done = name => toolCalls.some(c => c.tool === name);
    const call = (name, args) => ({ kind: 'tool_call', name, args });
    const orderCall = toolCalls.filter(c => c.tool === 'get_order')[0];
    const order = orderCall && orderCall.result.found ? orderCall.result.record : null;

    if (!ids.orderId && !ids.customerId) {
      return { kind: 'final', finalKind: 'clarify', text: 'Sorry about the problem. I can\'t see an order or customer number in your message. Could you send your order number so I can look into it?' };
    }
    if (ids.orderId && !orderCall) return call('get_order', { order_id: ids.orderId });
    if (ids.customerId && !done('get_customer')) return call('get_customer', { customer_id: ids.customerId });
    if (!ids.orderId) {
      return { kind: 'final', finalKind: 'clarify', text: 'Thanks, I found your account. Which order is this about? Please send the order number.' };
    }
    if (!order) {
      return { kind: 'final', finalKind: 'not_found', text: `I couldn't find an order with the number ${ids.orderId}. Could you check it and send it again?` };
    }

    const damaged = /damaged|broken|faulty|cracked|smashed/.test(t);
    const missingPart = /\bmissing\b/.test(t);
    const replacement = /replacement/.test(t);
    const refund = /refund|money back/.test(t);
    const wrongItem = /instead|wrong item|supposed to contain/.test(t);
    const notArrived = /not arrived|hasn't arrived|has not arrived|cannot find the parcel|can't find the parcel/.test(t);
    const claimsDelivered = /delivered/.test(t);

    if (claimsDelivered && order.status !== 'delivered') {
      return { kind: 'escalate', reason: `The customer says the order was delivered, but the record shows "${order.status}". A human should investigate the conflict.` };
    }
    if (notArrived && order.status === 'delivered') {
      return { kind: 'escalate', reason: 'The customer says the order has not arrived, but the record shows "delivered". A human should investigate.' };
    }
    if (notArrived && order.status === 'in_transit') {
      return { kind: 'final', finalKind: 'answer', text: `Order ${order.order_id} (${order.item}) is recorded as in transit. I can't see more detail than that yet.` };
    }

    const problem = damaged || missingPart || replacement || refund || wrongItem;
    if (!problem) {
      return { kind: 'final', finalKind: 'answer', text: `Order ${order.order_id} (${order.item}) is currently ${order.status.replace('_', ' ')}.` };
    }

    const policyId = (damaged || missingPart || replacement) ? (order.policy_id || 'REP-01') : refund ? 'REF-01' : 'RET-01';
    if (!done('get_policy')) return call('get_policy', { policy_id: policyId });
    if (wrongItem) {
      return { kind: 'escalate', reason: `The customer reports a different item from the record (${order.item}). Policy ${policyId} says to confirm details with a human before promising anything.` };
    }
    return { kind: 'escalate', reason: `Policy ${policyId} requires a human to verify eligibility before any replacement or refund is promised. This prototype cannot place replacement orders or issue refunds.` };
  }

  // Scripted failure behaviours, mirroring the failure paths the Python tests cover.
  function modelStep(mode, text, toolCalls, ids, iteration) {
    if (mode === 'malformed') throw new Error('Provider returned a malformed model response');
    if (mode === 'unsafe_tool' && iteration === 1) return { kind: 'tool_call', name: 'issue_refund', args: { order_id: ids.orderId || 'unknown', amount: 250 } };
    if (mode === 'never_finishes') return { kind: 'tool_call', name: 'list_policies', args: {} };
    return standInModel(text, toolCalls, ids);
  }

  /* ---- Escalation record (_build_escalation_record) ---- */
  function buildRecord(complaint, toolCalls, reason, source, flags, iteration) {
    const ids = { customer_id: {}, order_id: {}, policy_id: {} };
    const evidence = [{ label: 'Customer complaint', verified: false, note: 'unverified' }];
    toolCalls.forEach(c => {
      const r = c.result;
      if (!r || r.found !== true || !r.record) {
        if (r && r.found === false) evidence.push({ label: `${c.tool} for ${Object.keys(c.arguments).map(k => c.arguments[k])[0]}: not found`, verified: false, note: 'lookup' });
        return;
      }
      const rec = r.record;
      if (c.tool === 'get_order' && rec.order_id === c.arguments.order_id) {
        ids.order_id[rec.order_id] = ['get_order'];
        if (rec.customer_id) ids.customer_id[rec.customer_id] = (ids.customer_id[rec.customer_id] || []).concat('get_order');
        evidence.push({ label: `Order record ${rec.order_id}: ${rec.item}, £${rec.amount.toFixed(2)}, ${rec.status}`, verified: true, note: 'get_order' });
      } else if (c.tool === 'get_customer' && rec.customer_id === c.arguments.customer_id) {
        ids.customer_id[rec.customer_id] = (ids.customer_id[rec.customer_id] || []).concat('get_customer');
        evidence.push({ label: `Customer record ${rec.customer_id}: ${rec.name}, ${rec.tier}`, verified: true, note: 'get_customer' });
      } else if (c.tool === 'get_policy' && rec.policy_id === c.arguments.policy_id) {
        ids.policy_id[rec.policy_id] = ['get_policy'];
        evidence.push({ label: `Policy record ${rec.policy_id}: ${rec.topic}`, verified: true, note: 'get_policy' });
      }
    });
    const only = obj => { const k = Object.keys(obj); return k.length === 1 ? k[0] : null; };
    return {
      status: 'pending_human_review', reason, reasonSource: source,
      customerId: only(ids.customer_id), orderId: only(ids.order_id), policyId: only(ids.policy_id),
      safetyFlags: flags || [], iteration, evidence
    };
  }

  const short = obj => JSON.stringify(obj);

  function run(text, opts) {
    const o = opts || {};
    const mode = o.mode || 'normal';
    const steps = [];
    const add = (kind, status, title, detail) => steps.push({ kind, status, title, detail: detail || '' });
    const state = { toolCalls: [], iterations: 0, decisions: [], flags: [] };
    let outcome = null;

    const escalate = (reason, source, flags) => {
      const record = buildRecord(text, state.toolCalls, reason, source, flags, state.iterations);
      outcome = {
        type: 'human', label: 'HUMAN REVIEW', record,
        summary: `Escalated as ${record.status}.`,
        reasons: [reason]
      };
    };

    add('complaint', 'info', 'Complaint received', text);
    const assessment = assessComplaint(text, o);
    state.flags = assessment.flags;
    add('safety', assessment.escalate ? 'blocked' : 'ok', 'Intake safety screen',
      assessment.escalate ? 'Flags: ' + assessment.flags.join(', ') + '. Escalating before any model call.' : 'No risk flags raised.');

    if (assessment.escalate) {
      state.decisions.push('safety_escalation');
      escalate('Safety screening flagged: ' + assessment.flags.join(', '), 'safety_screen', assessment.flags);
    } else {
      const ids = extractIds(text);
      for (let i = 1; i <= D.maxIterations && !outcome; i++) {
        state.iterations = i;
        add('model', 'info', `Model call ${i}`, mode === 'normal' ? 'A scripted stand-in picks the next step (the real project uses qwen3:4b).' : 'Simulated failure: ' + D.modes.filter(m => m.id === mode)[0].label + '.');

        let resp;
        try { resp = modelStep(mode, text, state.toolCalls, ids, i); }
        catch (e) {
          add('model', 'blocked', 'Model output rejected', e.message);
          state.decisions.push('provider_or_output_failure');
          escalate('The model could not safely process this case.', 'agent', []);
          break;
        }

        if (resp.kind === 'final') {
          state.decisions.push('resolution');
          const summaries = { answer: 'The model answered from a verified record.', clarify: 'The model asked the customer for missing information.', not_found: 'The model reported that no matching record was found.' };
          outcome = { type: 'final', label: 'FINAL RESPONSE', summary: summaries[resp.finalKind], reply: resp.text, reasons: [] };
          add('model', 'info', 'Model returns a final response', resp.text);
          break;
        }
        if (resp.kind === 'escalate') {
          add('model', 'info', 'Model escalates', resp.reason);
          state.decisions.push('model_escalation');
          escalate(resp.reason, 'model_response', []);
          break;
        }

        add('model', 'info', `Model proposes ${resp.name}`, short(resp.args));
        let result;
        try { result = executeTool({ name: resp.name, arguments: resp.args }); }
        catch (e) {
          if (!(e instanceof ToolValidationError)) throw e;
          state.toolCalls.push({ tool: resp.name, arguments: resp.args, result: { error: e.message } });
          add('tool', 'blocked', 'Rejected: tool validation failed', e.message);
          state.decisions.push('invalid_tool_request');
          escalate('The requested tool action could not be validated.', 'agent', []);
          break;
        }
        state.toolCalls.push({ tool: resp.name, arguments: resp.args, result });
        const notFound = result && !Array.isArray(result) && result.found === false;
        add('tool', notFound ? 'info' : 'ok', `${resp.name} ${notFound ? 'found nothing' : 'succeeded'}`,
          short(Array.isArray(result) ? result.map(p => p.policy_id) : (notFound ? result.error : result.record)));
      }

      if (!outcome) {
        add('safety', 'blocked', 'Iteration limit reached', `Stopped after ${D.maxIterations} model calls.`);
        state.decisions.push('iteration_limit');
        escalate('The agent reached its maximum number of model iterations.', 'agent', []);
      }
    }

    add('decision', outcome.type === 'final' ? 'ok' : 'info', 'Decision: ' + outcome.label, outcome.summary);
    return { steps, outcome, state: { iterations: state.iterations, decisions: state.decisions, flags: state.flags, observedTools: state.toolCalls.map(c => c.tool) } };
  }

  const api = { run, assessComplaint, executeTool, ToolValidationError, extractIds, toolNames: Object.keys(TOOLS), MAX_ITERATIONS: D.maxIterations };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ComplaintEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);

/* Generated from the Python project's scenario-matrix report (data/complaint_decision_intent_scenario_matrix_report.json),
 * its matrix, taxonomy and workflow contract. Synthetic offline diagnostics; no model was used. */
(function (root) {
  'use strict';
  const data = {
 "source": {
  "matrix": "customer-complaint-decision-intent-scenario-matrix",
  "taxonomy": "customer-complaint-decision-intents",
  "contract": "customer-complaint-workflow",
  "contractVersion": 2,
  "provenance": "Hand-authored from the decision-intent taxonomy, workflow contract, read-only tool semantics, and synthetic policy statements. Intents are explicit annotations; no model or evaluation dataset is used."
 },
 "summary": {
  "scenarios": 19,
  "correct": 11,
  "incorrect": 0,
  "unscored": 8,
  "unknown": 6,
  "gate": {
   "allow": 4,
   "block": 9,
   "unknown": 6
  }
 },
 "intents": [
  {
   "id": "factual_order_status_update",
   "title": "Factual order status update",
   "supportStatus": "supported",
   "purpose": "Report facts about an order record, such as its recorded status or contents, without claiming that a real-world event has been independently proven beyond that record.",
   "coverage": {
    "scenario_count": 8,
    "correct_classifications": 6,
    "incorrect_classifications": 0,
    "unknown_outcomes": 1,
    "unresolved_expected": 2
   }
  },
  {
   "id": "applicable_policy_explanation",
   "title": "Applicable policy explanation",
   "supportStatus": "supported with unresolved applicability",
   "purpose": "Explain the content of a retrieved policy only after an explicit determination that it applies to the request.",
   "coverage": {
    "scenario_count": 3,
    "correct_classifications": 2,
    "incorrect_classifications": 0,
    "unknown_outcomes": 1,
    "unresolved_expected": 1
   }
  },
  {
   "id": "remedy_or_eligibility_explanation",
   "title": "Remedy or eligibility explanation",
   "supportStatus": "limited",
   "purpose": "Describe documented remedy constraints and the need for review without deciding eligibility, promising a remedy, or performing an action.",
   "coverage": {
    "scenario_count": 3,
    "correct_classifications": 2,
    "incorrect_classifications": 0,
    "unknown_outcomes": 1,
    "unresolved_expected": 1
   }
  },
  {
   "id": "request_missing_information",
   "title": "Request missing information",
   "supportStatus": "partially supported",
   "purpose": "Ask for information explicitly identified by the workflow as necessary to continue a customer- or order-record lookup or to clarify a customer-reported statement.",
   "coverage": {
    "scenario_count": 3,
    "correct_classifications": 1,
    "incorrect_classifications": 0,
    "unknown_outcomes": 1,
    "unresolved_expected": 2
   }
  },
  {
   "id": "human_review_escalation",
   "title": "Human review escalation",
   "supportStatus": "supported as a route not as a substantive resolution",
   "purpose": "Route a complaint for human review without representing the referral as a completed remedy or resolved complaint.",
   "coverage": {
    "scenario_count": 2,
    "correct_classifications": 0,
    "incorrect_classifications": 0,
    "unknown_outcomes": 2,
    "unresolved_expected": 2
   }
  }
 ],
 "categories": [
  {
   "id": "complaint_facts",
   "title": "Complaint facts",
   "meaning": "Facts stated by the customer in the complaint."
  },
  {
   "id": "verified_customer_records",
   "title": "Verified customer records",
   "meaning": "Customer facts returned by a successful matching customer-record lookup."
  },
  {
   "id": "verified_order_records",
   "title": "Verified order records",
   "meaning": "Order facts returned by a successful matching order-record lookup."
  },
  {
   "id": "applicable_policy_information",
   "title": "Applicable policy information",
   "meaning": "Policy information verified from the policy store and determined to apply to the complaint or requested remedy."
  },
  {
   "id": "human_review_requirements",
   "title": "Human review requirements",
   "meaning": "An explicit determination from applicable, verified policy or deterministic safety screening about whether human review is required."
  }
 ],
 "states": [
  {
   "id": "verified",
   "meaning": "A fact has a traceable source and passed the category-specific verification conditions."
  },
  {
   "id": "customer_reported",
   "meaning": "A fact is present in the complaint but has not been independently verified; it supports only an explicitly attributed statement."
  },
  {
   "id": "missing",
   "meaning": "No evidence for the required fact/category is recorded or retrieved."
  },
  {
   "id": "failed",
   "meaning": "A lookup was attempted but failed for an application, validation, transport, or execution reason."
  },
  {
   "id": "not_found",
   "meaning": "A valid lookup completed and explicitly reported that no matching record exists."
  },
  {
   "id": "unknown",
   "meaning": "Evidence, provenance, applicability, or the decision-to-evidence mapping is absent, ambiguous, or insufficient."
  }
 ],
 "scenarios": [
  {
   "id": "order-status-verified-record",
   "title": "Order status verified record",
   "intent": "factual_order_status_update",
   "expected": "supported",
   "actual": "supported",
   "gate": "allow",
   "correct": true,
   "reason": "All required evidence and policy checks are verified for this decision intent.",
   "conditions": {
    "compare_with_customer_report": false
   },
   "evidence": {
    "complaint_facts": "missing",
    "verified_customer_records": "missing",
    "verified_order_records": "verified",
    "applicable_policy_information": "missing",
    "human_review_requirements": "missing"
   },
   "policyReview": "not_required",
   "unresolved": [],
   "issues": [
    "taxonomy_declares_conditionals_not_in_contract"
   ]
  },
  {
   "id": "order-status-missing-record",
   "title": "Order status missing record",
   "intent": "factual_order_status_update",
   "expected": "blocked",
   "actual": "blocked",
   "gate": "block",
   "correct": true,
   "reason": "At least one required evidence category is missing, failed, or not found.",
   "conditions": {
    "compare_with_customer_report": false
   },
   "evidence": {
    "complaint_facts": "missing",
    "verified_customer_records": "missing",
    "verified_order_records": "missing",
    "applicable_policy_information": "missing",
    "human_review_requirements": "missing"
   },
   "policyReview": "not_required",
   "unresolved": [],
   "issues": [
    "taxonomy_declares_conditionals_not_in_contract"
   ]
  },
  {
   "id": "order-status-lookup-failed",
   "title": "Order status lookup failed",
   "intent": "factual_order_status_update",
   "expected": "blocked",
   "actual": "blocked",
   "gate": "block",
   "correct": true,
   "reason": "At least one required evidence category is missing, failed, or not found.",
   "conditions": {
    "compare_with_customer_report": false
   },
   "evidence": {
    "complaint_facts": "missing",
    "verified_customer_records": "missing",
    "verified_order_records": "failed",
    "applicable_policy_information": "missing",
    "human_review_requirements": "missing"
   },
   "policyReview": "not_required",
   "unresolved": [
    "The required order lookup failed and cannot establish order status."
   ],
   "issues": [
    "taxonomy_declares_conditionals_not_in_contract"
   ]
  },
  {
   "id": "order-status-irrelevant-policy-lookup",
   "title": "Order status irrelevant policy lookup",
   "intent": "factual_order_status_update",
   "expected": "blocked",
   "actual": "blocked",
   "gate": "block",
   "correct": true,
   "reason": "At least one required evidence category is missing, failed, or not found.",
   "conditions": {
    "compare_with_customer_report": false
   },
   "evidence": {
    "complaint_facts": "missing",
    "verified_customer_records": "missing",
    "verified_order_records": "missing",
    "applicable_policy_information": "verified",
    "human_review_requirements": "missing"
   },
   "policyReview": "not_required",
   "unresolved": [
    "A successful policy lookup is irrelevant to an order-status claim and cannot replace a matching order record."
   ],
   "issues": [
    "taxonomy_declares_conditionals_not_in_contract"
   ]
  },
  {
   "id": "order-status-lookup-not-found",
   "title": "Order status lookup not found",
   "intent": "factual_order_status_update",
   "expected": "blocked",
   "actual": "blocked",
   "gate": "block",
   "correct": true,
   "reason": "At least one required evidence category is missing, failed, or not found.",
   "conditions": {
    "compare_with_customer_report": false
   },
   "evidence": {
    "complaint_facts": "missing",
    "verified_customer_records": "missing",
    "verified_order_records": "not_found",
    "applicable_policy_information": "missing",
    "human_review_requirements": "missing"
   },
   "policyReview": "not_required",
   "unresolved": [
    "A not-found order lookup cannot support an order-status claim."
   ],
   "issues": [
    "taxonomy_declares_conditionals_not_in_contract"
   ]
  },
  {
   "id": "order-status-untraceable-identifier",
   "title": "Order status untraceable identifier",
   "intent": "factual_order_status_update",
   "expected": "unresolved",
   "actual": "unknown",
   "gate": "unknown",
   "correct": null,
   "reason": "Evidence or policy applicability/review status is unresolved.",
   "conditions": {
    "compare_with_customer_report": false
   },
   "evidence": {
    "complaint_facts": "missing",
    "verified_customer_records": "missing",
    "verified_order_records": "unknown",
    "applicable_policy_information": "missing",
    "human_review_requirements": "missing"
   },
   "policyReview": "not_required",
   "unresolved": [
    "The lookup result has no compliant identifier provenance, so it is not verified order evidence."
   ],
   "issues": [
    "taxonomy_declares_conditionals_not_in_contract"
   ]
  },
  {
   "id": "order-status-compared-with-customer-report",
   "title": "Order status compared with customer report",
   "intent": "factual_order_status_update",
   "expected": "supported",
   "actual": "supported",
   "gate": "allow",
   "correct": true,
   "reason": "All required evidence and policy checks are verified for this decision intent.",
   "conditions": {
    "compare_with_customer_report": true
   },
   "evidence": {
    "complaint_facts": "customer_reported",
    "verified_customer_records": "missing",
    "verified_order_records": "verified",
    "applicable_policy_information": "missing",
    "human_review_requirements": "missing"
   },
   "policyReview": "not_required",
   "unresolved": [],
   "issues": [
    "taxonomy_conditional_categories_not_in_contract",
    "taxonomy_declares_conditionals_not_in_contract"
   ]
  },
  {
   "id": "order-status-verified-complaint-derived-fact",
   "title": "Order status verified complaint derived fact",
   "intent": "factual_order_status_update",
   "expected": "unresolved",
   "actual": "supported",
   "gate": "allow",
   "correct": null,
   "reason": "All required evidence and policy checks are verified for this decision intent.",
   "conditions": {
    "compare_with_customer_report": true
   },
   "evidence": {
    "complaint_facts": "verified",
    "verified_customer_records": "missing",
    "verified_order_records": "verified",
    "applicable_policy_information": "missing",
    "human_review_requirements": "missing"
   },
   "policyReview": "not_required",
   "unresolved": [
    "The contract defines complaint_facts as customer-reported, not independently verified; the adapter accepts a generic verified state without enforcing that provenance restriction."
   ],
   "issues": [
    "taxonomy_conditional_categories_not_in_contract",
    "taxonomy_declares_conditionals_not_in_contract"
   ]
  },
  {
   "id": "policy-explanation-applicable",
   "title": "Policy explanation applicable",
   "intent": "applicable_policy_explanation",
   "expected": "supported",
   "actual": "supported",
   "gate": "allow",
   "correct": true,
   "reason": "All required evidence and policy checks are verified for this decision intent.",
   "conditions": {},
   "evidence": {
    "complaint_facts": "missing",
    "verified_customer_records": "missing",
    "verified_order_records": "missing",
    "applicable_policy_information": "verified",
    "human_review_requirements": "verified"
   },
   "policyReview": "not_required",
   "unresolved": [],
   "issues": []
  },
  {
   "id": "policy-explanation-ambiguous-applicability",
   "title": "Policy explanation ambiguous applicability",
   "intent": "applicable_policy_explanation",
   "expected": "unresolved",
   "actual": "unknown",
   "gate": "unknown",
   "correct": null,
   "reason": "Evidence or policy applicability/review status is unresolved.",
   "conditions": {},
   "evidence": {
    "complaint_facts": "missing",
    "verified_customer_records": "missing",
    "verified_order_records": "missing",
    "applicable_policy_information": "unknown",
    "human_review_requirements": "unknown"
   },
   "policyReview": "unknown",
   "unresolved": [
    "Policy text may have been retrieved, but its applicability and review requirement are ambiguous."
   ],
   "issues": []
  },
  {
   "id": "policy-explanation-review-required",
   "title": "Policy explanation review required",
   "intent": "applicable_policy_explanation",
   "expected": "blocked",
   "actual": "blocked",
   "gate": "block",
   "correct": true,
   "reason": "Applicable verified policy or safety evidence requires human review.",
   "conditions": {},
   "evidence": {
    "complaint_facts": "missing",
    "verified_customer_records": "missing",
    "verified_order_records": "missing",
    "applicable_policy_information": "verified",
    "human_review_requirements": "verified"
   },
   "policyReview": "required",
   "unresolved": [],
   "issues": []
  },
  {
   "id": "remedy-explanation-review-required",
   "title": "Remedy explanation review required",
   "intent": "remedy_or_eligibility_explanation",
   "expected": "blocked",
   "actual": "blocked",
   "gate": "block",
   "correct": true,
   "reason": "Applicable verified policy or safety evidence requires human review.",
   "conditions": {
    "customer_specific_assertion": false,
    "remedy_claim_attribution": true
   },
   "evidence": {
    "complaint_facts": "customer_reported",
    "verified_customer_records": "missing",
    "verified_order_records": "verified",
    "applicable_policy_information": "verified",
    "human_review_requirements": "verified"
   },
   "policyReview": "required",
   "unresolved": [],
   "issues": []
  },
  {
   "id": "remedy-explanation-review-unknown",
   "title": "Remedy explanation review unknown",
   "intent": "remedy_or_eligibility_explanation",
   "expected": "unresolved",
   "actual": "unknown",
   "gate": "unknown",
   "correct": null,
   "reason": "Evidence or policy applicability/review status is unresolved.",
   "conditions": {
    "customer_specific_assertion": false,
    "remedy_claim_attribution": false
   },
   "evidence": {
    "complaint_facts": "missing",
    "verified_customer_records": "missing",
    "verified_order_records": "verified",
    "applicable_policy_information": "verified",
    "human_review_requirements": "unknown"
   },
   "policyReview": "unknown",
   "unresolved": [
    "No verified review determination establishes whether a remedy-related final response is appropriate."
   ],
   "issues": []
  },
  {
   "id": "remedy-customer-specific-record-missing",
   "title": "Remedy customer specific record missing",
   "intent": "remedy_or_eligibility_explanation",
   "expected": "blocked",
   "actual": "blocked",
   "gate": "block",
   "correct": true,
   "reason": "At least one required evidence category is missing, failed, or not found.",
   "conditions": {
    "customer_specific_assertion": true,
    "remedy_claim_attribution": false
   },
   "evidence": {
    "complaint_facts": "missing",
    "verified_customer_records": "missing",
    "verified_order_records": "verified",
    "applicable_policy_information": "verified",
    "human_review_requirements": "unknown"
   },
   "policyReview": "unknown",
   "unresolved": [
    "The annotated customer-specific claim requires a customer record, but no matching record is available; policy review is also unresolved."
   ],
   "issues": []
  },
  {
   "id": "missing-information-request-no-record-claim",
   "title": "Missing information request no record claim",
   "intent": "request_missing_information",
   "expected": "unresolved",
   "actual": "blocked",
   "gate": "block",
   "correct": null,
   "reason": "At least one required evidence category is missing, failed, or not found.",
   "conditions": {
    "clarifies_customer_report": false,
    "customer_record_claim": false,
    "order_record_claim": false
   },
   "evidence": {
    "complaint_facts": "missing",
    "verified_customer_records": "missing",
    "verified_order_records": "missing",
    "applicable_policy_information": "missing",
    "human_review_requirements": "missing"
   },
   "policyReview": "not_required",
   "unresolved": [
    "The taxonomy requires no evidence category merely to ask for a missing identifier, but acknowledge_or_clarify in the workflow contract unconditionally requires complaint_facts."
   ],
   "issues": [
    "taxonomy_and_contract_base_requirements_differ",
    "taxonomy_declares_conditionals_not_in_contract"
   ]
  },
  {
   "id": "missing-information-request-clarifies-report",
   "title": "Missing information request clarifies report",
   "intent": "request_missing_information",
   "expected": "unresolved",
   "actual": "unknown",
   "gate": "unknown",
   "correct": null,
   "reason": "Evidence or policy applicability/review status is unresolved.",
   "conditions": {
    "clarifies_customer_report": true,
    "customer_record_claim": false,
    "order_record_claim": false
   },
   "evidence": {
    "complaint_facts": "customer_reported",
    "verified_customer_records": "missing",
    "verified_order_records": "missing",
    "applicable_policy_information": "missing",
    "human_review_requirements": "missing"
   },
   "policyReview": "not_required",
   "unresolved": [],
   "issues": [
    "taxonomy_and_contract_base_requirements_differ",
    "taxonomy_declares_conditionals_not_in_contract"
   ]
  },
  {
   "id": "missing-information-request-makes-unverified-order-claim",
   "title": "Missing information request makes unverified order claim",
   "intent": "request_missing_information",
   "expected": "blocked",
   "actual": "blocked",
   "gate": "block",
   "correct": true,
   "reason": "At least one required evidence category is missing, failed, or not found.",
   "conditions": {
    "clarifies_customer_report": false,
    "customer_record_claim": false,
    "order_record_claim": true
   },
   "evidence": {
    "complaint_facts": "missing",
    "verified_customer_records": "missing",
    "verified_order_records": "missing",
    "applicable_policy_information": "missing",
    "human_review_requirements": "missing"
   },
   "policyReview": "not_required",
   "unresolved": [
    "A customer/order record assertion is made without the successful matching lookup required by the taxonomy."
   ],
   "issues": [
    "taxonomy_and_contract_base_requirements_differ",
    "taxonomy_conditional_categories_not_in_contract",
    "taxonomy_declares_conditionals_not_in_contract"
   ]
  },
  {
   "id": "human-review-escalation-policy-based",
   "title": "Human review escalation policy based",
   "intent": "human_review_escalation",
   "expected": "unresolved",
   "actual": "unknown",
   "gate": "unknown",
   "correct": null,
   "reason": "Decision intent is absent or not defined by the contract.",
   "conditions": {
    "policy_based_review_reason": true
   },
   "evidence": {
    "complaint_facts": "missing",
    "verified_customer_records": "missing",
    "verified_order_records": "missing",
    "applicable_policy_information": "verified",
    "human_review_requirements": "verified"
   },
   "policyReview": "required",
   "unresolved": [
    "The taxonomy supports escalation as a route, but the workflow contract defines no human_review_escalation decision contract."
   ],
   "issues": [
    "taxonomy_intent_has_no_workflow_contract_decision"
   ]
  },
  {
   "id": "human-review-escalation-unverified-reason",
   "title": "Human review escalation unverified reason",
   "intent": "human_review_escalation",
   "expected": "unresolved",
   "actual": "unknown",
   "gate": "unknown",
   "correct": null,
   "reason": "Decision intent is absent or not defined by the contract.",
   "conditions": {
    "policy_based_review_reason": false
   },
   "evidence": {
    "complaint_facts": "missing",
    "verified_customer_records": "missing",
    "verified_order_records": "missing",
    "applicable_policy_information": "missing",
    "human_review_requirements": "unknown"
   },
   "policyReview": "unknown",
   "unresolved": [
    "Neither an explicit review requirement nor a verified applicable policy or safety signal supports the escalation reason."
   ],
   "issues": [
    "taxonomy_intent_has_no_workflow_contract_decision"
   ]
  }
 ],
 "limitations": [
  "Automatic mapping from arbitrary final-response text to an intent is unresolved.",
  "Applicability of retrieved policy text to a complaint is unresolved unless independently annotated.",
  "The available traces do not map individual response claims to exact record fields or policy clauses.",
  "Conflicting customer-reported statements and retrieved records require claim-specific comparison; a record is evidence of the stored value, not proof of the real-world event.",
  "Policy data support referral and limits on promises/actions, but do not define a complete remedy eligibility decision procedure."
 ],
 "inconsistencies": [
  "Adapter accepts verified state for customer reported complaint facts",
  "Taxonomy and contract base requirements differ",
  "Taxonomy conditional categories not in contract",
  "Taxonomy declares conditionals not in contract",
  "Taxonomy intent has no workflow contract decision"
 ]
};
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.EvalData = data;
})(typeof window !== 'undefined' ? window : globalThis);

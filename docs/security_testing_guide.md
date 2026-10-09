# DVLA Security Testing Guide: OWASP Top 10 for LLMs

This guide explains the educational testing methodology implemented in the **LLM Agent Attack Lab (DVLA)**.

### Category Breakdown

1. **Prompt Injection (LLM01)**
   - **Risk**: Crafty user input manipulates the LLM into discarding developer instructions.
   - **Simulation**: Test inputs simulate delimiter attacks and directive overrides.
   - **Safe Defense**: Strict boundary delimiters (XML/JSON), secondary input classification, and architectural isolation.

2. **Jailbreak Resistance**
   - **Risk**: Persona-adoption tricks (such as "DAN") coerce the model to bypass safety constraints.
   - **Safe Defense**: Adversarial red-teaming, constitutional AI training, and system prompt sandwiching.

3. **Sensitive Data Leakage (LLM06)**
   - **Risk**: Agents regurgitating proprietary credentials, PII, or internal tokens.
   - **Simulation**: Uses synthetic canaries such as `CANARY-DVLA-7788` and `sk-dvla-demo-9481`.
   - **Safe Defense**: Never put real credentials in prompts; use secure key vaults and output regex redaction.

4. **Insecure Tool Usage (LLM08)**
   - **Risk**: LLM agents invoking backend tools with unconstrained parameters.
   - **Safe Defense**: Parameterize tool interfaces, enforce backend principle of least privilege, and validate authorization independent of model claims.

5. **System Prompt Disclosure (LLM07)**
   - **Risk**: Extracting confidential developer instructions via meta-prompting.
   - **Safe Defense**: Instruct model to summarize capabilities rather than quoting verbatim prompts; apply output filtering.

6. **Excessive Agency (LLM09)**
   - **Risk**: Agents executing high-impact state-altering actions autonomously.
   - **Safe Defense**: Human-in-the-loop (HITL) authorization for destructive operations.

7. **Output Validation (LLM02)**
   - **Risk**: Downstream systems blindly trusting LLM output, introducing XSS or SQL injection.
   - **Safe Defense**: Treat all LLM output as untrusted user input; sanitize with DOMPurify and parameterized DB queries.

8. **Indirect Prompt Injection**
   - **Risk**: Malicious instructions embedded inside retrieved documents, search results, or uploaded files.
   - **Safe Defense**: Treat ingested documents as passive data contexts, separate from instruction channels.

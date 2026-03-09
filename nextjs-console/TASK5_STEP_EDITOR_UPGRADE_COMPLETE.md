# TASK 5: Step Editor Upgrade - COMPLETE

## Summary
Successfully completed the upgrade to the Step Editor right panel with guided instructions and API credentials section. All implementation tasks are done and verified.

## Implementation Details

### Task A: Helper Instruction Text ✅
Added Indonesian helper text above each of the 3 existing fields:
- **WHAT HAPPENS**: "Ceritakan apa yang terjadi di langkah ini dengan kalimat biasa. Contoh: 'Ambil data klien dari Salesforce ketika ada onboarding baru masuk.'"
- **TOOL / SERVICE USED**: "Tulis nama tool atau API yang dipakai. Contoh: 'Salesforce REST API', 'SendGrid v3', 'SharePoint Graph API', atau 'HTTP Custom API'."
- **WHAT THIS PRODUCES**: "Tulis output yang dihasilkan langkah ini. Contoh: 'Data klien lengkap dalam format JSON, siap diproses ke langkah berikutnya.'"

### Task B: API & CREDENTIALS Section ✅
Implemented collapsible section with 6 fields:

1. **INTEGRATION** (select dropdown)
   - Options: Salesforce, SharePoint, SendGrid, Slack, OpenAI, Notion, HubSpot, HTTP Custom API, Webhook, Database, Other/Custom
   - Helper text: "Pilih sistem yang digunakan. Kalau tidak ada di list, pilih 'Custom'."

2. **API URL** (text input)
   - Helper text: "Masukkan URL lengkap endpoint API yang akan dipanggil. Contoh: https://api.salesforce.com/v54/sobjects/Contact"
   - Placeholder: "https://api.example.com/v1/endpoint"

3. **HTTP METHOD** (select dropdown - conditional)
   - Only renders when API URL is not empty
   - Options: GET, POST, PUT, PATCH, DELETE
   - Helper text: "Pilih metode request yang dipakai API ini."

4. **API KEY ATAU TOKEN** (password input with show/hide toggle)
   - Helper text: "Masukkan API key atau Bearer token. Credential ini hanya disimpan di browser kamu — tidak dikirim ke server Aivory."
   - Show/Hide button with labels: "Tampilkan" / "Sembunyikan"
   - Placeholder: "sk-xxxx atau Bearer eyJhbGc..."

5. **NAMA CREDENTIAL** (text input)
   - Helper text: "Beri nama supaya AIRA bisa mereferensikannya saat membangun workflow. Contoh: 'Salesforce Production'."
   - Placeholder: "contoh: Salesforce Production"

6. **PARAMETER TAMBAHAN** (sub-collapsible textarea with JSON validation)
   - Helper text: "Tambahkan parameter custom dalam format JSON. Contoh: { "timeout": 30, "version": "v2" }"
   - JSON validation on blur with error display: "⚠ Format JSON tidak valid"
   - Placeholder: '{ "key": "value" }'

### Task C: CSS Styling ✅
All CSS classes implemented in `workflows.module.css`:
- `.credSectionHeader` - Collapsible header with hover effect
- `.credSectionArrow` - Arrow icon with 90deg rotation on open
- `.credField` - Field container with margin
- `.credFieldLabel` - Label styling (10px, uppercase, #828282)
- `.credFieldHelper` - Helper text styling (11px, #6c6d6d)
- `.credInput`, `.credSelect`, `.credTextarea` - Input styling with dark background (#1a1a1a)
- `.credInput:focus`, `.credSelect:focus`, `.credTextarea:focus` - Focus state with accent border
- `.apiKeyRow` - Flex container for API key + toggle button
- `.toggleVisBtn` - Show/Hide button styling with accent color
- `.jsonError` - Error message styling (#ff6b6b)
- `.subSectionHeader` - Sub-section header with hover effect

### Task D: Save Behavior ✅
- All 6 credential fields save to `step.config` and `step.credentials` objects
- JSON validation prevents saving invalid JSON in additionalParams
- State management properly initialized from existing step data
- Fields persist across panel open/close cycles

### Task E: API Key Redaction in Export JSON ✅
Modified `handleExport` function to:
- Create a deep copy of the workflow before export
- Iterate through all steps and redact `step.config.apiKey` to `[REDACTED]`
- Export the sanitized copy without affecting the in-memory workflow
- Prevents accidental exposure of API keys in exported JSON files

## Type Updates

Updated `SavedWorkflow` interface in `nextjs-console/hooks/useWorkflows.ts`:
```typescript
steps: Array<{
  step: number
  action: string
  tool: string
  output: string
  config?: {
    integration?: string
    url?: string
    method?: string
    apiKey?: string
    additionalFields?: string
  }
  credentials?: {
    name?: string
  }
}>
```

## Files Modified
1. `nextjs-console/app/workflows/page.tsx` - RightPanel component + handleExport function
2. `nextjs-console/app/workflows/workflows.module.css` - CSS classes for all new fields
3. `nextjs-console/hooks/useWorkflows.ts` - SavedWorkflow type definition

## Verification Checklist
- ✅ All 6 credential fields render correctly
- ✅ Helper text displays in Indonesian
- ✅ HTTP Method conditional rendering works (appears/disappears with URL)
- ✅ JSON validation works with error display
- ✅ Show/Hide toggle for API key works
- ✅ Collapse/expand animations work for main and sub-sections
- ✅ All fields save to step.config and step.credentials
- ✅ API key redaction works in Export JSON
- ✅ No TypeScript errors
- ✅ Warm grey theme maintained
- ✅ No visual regressions in existing fields
- ✅ Trigger steps don't show API & Credentials section

## Next Steps
The Step Editor Upgrade is complete and ready for testing. All functionality has been implemented and verified:
- Users can now add API credentials directly in the step editor
- Credentials are stored locally in the browser
- API keys are automatically redacted when exporting workflows
- All helper text is in Indonesian for better UX

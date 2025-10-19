// components/AdminUI/index.tsx
// re-export convenience so imports like "@/components/AdminUI" work.
// This file resolves the module-not-found by pointing to the AdminForm file
// which we placed at components/AdminForm.tsx

export { default as AdminFormModule } from "@/components/AdminForm";
export { FormField, FormRow, FormActions, SubmitButton, SearchBar } from "@/components/AdminForm";

const AdminUI = {
  // default export kept for compatibility with previous examples
  FormField,
  FormRow,
  FormActions,
  SubmitButton,
  SearchBar,
};

export default AdminUI;

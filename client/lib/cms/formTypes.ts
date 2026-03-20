// client/lib/cms/formTypes.ts

export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "file"
  | "html";

export interface FormFieldDef {
  id: string;
  type: FormFieldType;
  name: string;
  label: string;
  required: boolean;
  /** Options for select, radio, checkbox fields */
  options?: string[];
  /** HTML content for "html" notice fields */
  htmlContent?: string;
  /** Accepted mime types for file upload fields */
  accept?: string;
}

export interface CmsForm {
  id: string;
  name: string;
  display_name: string;
  fields: FormFieldDef[];
  submit_button_text: string;
  success_message: string;
  created_at: string;
  updated_at: string;
}

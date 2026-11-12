import { forwardRef, useRef, useState } from "react";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as TinyMCEEditor } from "tinymce";
import { Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import MediaInput from "./media-input/MediaInput";

const WYSIWYGEditor = forwardRef(
  (
    props: {
      className?: string;
      onSizeChange?: () => void;
      onChange: (T: string) => void;
      value: string;
      placeholder?: string;
      disabled?: boolean;
    },
    ref: React.ForwardedRef<HTMLDivElement>,
  ) => {
    const editorRef = useRef<TinyMCEEditor | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const imageForm = useForm({ defaultValues: { editorImage: "" } });
    const pickCallback =
      useRef<(url: string, metadata: { title: string }) => void>();
    const init = {
      placeholder: props.placeholder,
      plugins: [
        "advlist autolink link image lists charmap print preview hr anchor pagebreak",
        "autoresize",
        "searchreplace wordcount visualblocks visualchars insertdatetime media nonbreaking",
        "table  directionality emoticons paste  code  ",
      ],
      toolbar1:
        "undo redo | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | styleselect",
      toolbar2:
        "| link unlink anchor | image media | forecolor backcolor  | print preview code ",
      image_advtab: true,
      image_title: true,
      automatic_uploads: false,
      paste_data_images: false,
      image_uploadtab: false,
      file_picker_types: "image",
      file_picker_callback: (callback) => {
        if (props.disabled) return;
        pickCallback.current = callback;
        imageForm.reset({ editorImage: "" });
        setPickerOpen(true);
      },
      setup(editor) {
        editor.on("ResizeEditor", (e) => {
          props.onSizeChange?.();
        });
      },
    };
    return (
      <div>
        {props.placeholder && (
          <Typography className="mb-4">{props.placeholder}</Typography>
        )}
        <Editor
          tinymceScriptSrc="/assets/tinymce/tinymce.min.js"
          init={init}
          disabled={props.disabled}
          value={props.value}
          onEditorChange={(a) => props.onChange(a)}
          onGetContent={(evt, editor) => {
            return (editorRef.current = editor);
          }}
          onInit={(evt, editor) => {
            props.onSizeChange?.();
            return (editorRef.current = editor);
          }}
        />
        <Dialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          sx={{ zIndex: 1600 }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>{props.placeholder}</DialogTitle>
          <DialogContent>
            <FormProvider {...imageForm}>
              <MediaInput
                name="editorImage"
                label="Image"
                disableImageCropper
                disabled={props.disabled}
                onUploadDone={(url) => {
                  pickCallback.current?.(url, { title: "" });
                  pickCallback.current = undefined;
                  setPickerOpen(false);
                }}
              />
            </FormProvider>
          </DialogContent>
        </Dialog>
      </div>
    );
  },
);

export default WYSIWYGEditor;

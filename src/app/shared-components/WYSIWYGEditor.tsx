import { forwardRef, useRef } from "react";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as TinyMCEEditor } from "tinymce";
import { Typography } from "@mui/material";

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
      automatic_uploads: true,
      paste_data_images: true,
      file_picker_types: "image",
      file_picker_callback: function (cb, value, meta) {
        // Create an input element for file selection
        var input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");

        // Listen for when a file is selected
        input.onchange = function () {
          var file = input.files?.[0];
          if (!file || !editorRef.current) return;
          var reader = new FileReader();

          reader.onload = function () {
            // Create a unique ID for the blob
            var id = "blobid" + new Date().getTime();
            var blobCache = editorRef.current.editorUpload.blobCache;
            // Create a blob based on the result of FileReader
            var blobInfo = blobCache.create(
              id,
              file,
              String(reader.result).split(",")[1],
            );
            blobCache.add(blobInfo);

            // Pass the blob URI to TinyMCE along with the title (filename)
            cb(blobInfo.blobUri(), { title: file.name });
          };

          // Start reading the file as a Data URL
          reader.readAsDataURL(file);
        };

        // Programmatically click the input to trigger file selection
        input.click();
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
      </div>
    );
  },
);

export default WYSIWYGEditor;

import ReactQuill from 'react-quill-new';
import styles from './QuillEditor.module.css';
import 'react-quill-new/dist/quill.snow.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const modules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['link'],
    ['clean'],
  ],
};

const formats = [
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'align',
  'link',
];

export function QuillEditor({ value, onChange, placeholder = '请输入内容...' }: Props) {
  return (
    <div className={styles.wrapper}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}

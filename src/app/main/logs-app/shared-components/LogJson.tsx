import ILog from "../models/ILog";
export default function LogJson({ log }: { log: ILog }) {
  return (
    <pre
      dir="ltr"
      className="p-16 rounded-8 bg-gray-100 dark:bg-gray-900 text-13 whitespace-pre-wrap break-all max-w-full overflow-auto"
      data-testid="log-json"
    >
      {JSON.stringify(log, null, 2)}
    </pre>
  );
}

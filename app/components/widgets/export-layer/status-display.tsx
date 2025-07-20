interface StatusDisplayProps {
  status: string;
  statusType: "info" | "success" | "error" | "warning" | "";
}

export function StatusDisplay({ status, statusType }: StatusDisplayProps) {
  if (!status) return null;

  const getStatusClasses = () => {
    switch (statusType) {
      case "success":
        return "bg-[rgba(122,181,122,0.3)] border-green-400 text-[rgb(67, 90, 67)]";
      case "error":
        return "bg-red-100 border-red-400 text-red-700";
      case "warning":
        return "bg-yellow-100 border-yellow-400 text-yellow-700";
      default:
        return "bg-blue-100 border-blue-400 text-blue-700";
    }
  };

  return (
    <div className={`mb-4 p-3 mt-2 ${getStatusClasses()} border rounded`}>
      {status}
    </div>
  );
}

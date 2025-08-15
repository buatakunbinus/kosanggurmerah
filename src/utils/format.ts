// Format angka gaya Indonesia: titik sebagai pemisah ribuan (3.200.000)
export const formatCurrency = (n: number) => {
  const rounded = Math.round(n || 0);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const formatStatusBadgeColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-700";
    case "late":
      return "bg-red-100 text-red-700";
    case "unpaid":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

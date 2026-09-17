export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

export function calculateMainOrderStatus(
  statuses: OrderStatus[]
): OrderStatus {
  if (statuses.length === 0) {
    return "PENDING";
  }

  if (
    statuses.every(
      (status) => status === "CANCELLED"
    )
  ) {
    return "CANCELLED";
  }

  // ร้านที่ยกเลิกแล้วไม่ควรขวางสถานะของร้านอื่น
  const activeStatuses = statuses.filter(
    (status) => status !== "CANCELLED"
  );

  if (
    activeStatuses.every(
      (status) => status === "COMPLETED"
    )
  ) {
    return "COMPLETED";
  }

  if (
    activeStatuses.every(
      (status) =>
        status === "SHIPPED" ||
        status === "COMPLETED"
    )
  ) {
    return "SHIPPED";
  }

  if (
    activeStatuses.every(
      (status) =>
        status === "CONFIRMED" ||
        status === "SHIPPED" ||
        status === "COMPLETED"
    )
  ) {
    return "CONFIRMED";
  }

  return "PENDING";
}
import { getAuditLogsByBill } from "../Services/auditLogService.js";

export const getAuditLogsByTypeAndBill = async (req, res) => {
  try {
    const { type, billNo } = req.params;
    const { userId, page, limit } = req.query;

    if (!type || !billNo) {
      return res.status(400).json({ message: "type and billNo are required." });
    }

    const result = await getAuditLogsByBill({
      type,
      billNo,
      userId,
      page,
      limit,
    });

    if (!result.entity) {
      return res.status(404).json({ message: "Record not found." });
    }

    res.status(200).json({
      type: result.module,
      entityId: result.entity.id,
      billNo: result.billNo,
      logs: result.logs.map((log) => ({
        id: log.id,
        action: log.action,
        oldValue: log.oldValue,
        newValue: log.newValue,
        userId: log.userId,
        timestamp: log.createdAt,
        metadata: log.metadata,
      })),
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching audit logs by bill:", error);
    res.status(500).json({ message: "Error fetching audit logs." });
  }
};

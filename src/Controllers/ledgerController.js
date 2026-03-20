import {
  getAllLedgerEntries,
  getLedgerEntryById,
  getLedgerEntriesByParty,
} from "../Services/ledgerService.js";

export const getLedgers = async (req, res) => {
  try {
    const {
      userId,
      dateFrom,
      dateTo,
      partyName,
    } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const ledgers = await getAllLedgerEntries({
      userId,
      dateFrom,
      dateTo,
      partyName,
    });

    res.status(200).json(ledgers);
  } catch (error) {
    console.error("Error fetching ledgers:", error);
    res.status(500).json({ message: "Error fetching ledgers.", error });
  }
};

export const getLedgerById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const ledger = await getLedgerEntryById(id, userId);
    if (!ledger) {
      return res.status(404).json({ message: "Ledger entry not found." });
    }

    res.status(200).json(ledger);
  } catch (error) {
    console.error("Error fetching ledger entry:", error);
    res.status(500).json({ message: "Error fetching ledger entry.", error });
  }
};

export const getLedgerByPartyId = async (req, res) => {
  try {
    const { partyId } = req.params;
    const {
      userId,
      partyType,
      dateFrom,
      dateTo,
      partyName,
    } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    if (!partyId) {
      return res.status(400).json({ message: "partyId is required." });
    }

    const ledgers = await getLedgerEntriesByParty({
      userId,
      partyId,
      partyType,
      dateFrom,
      dateTo,
      partyName,
    });

    res.status(200).json(ledgers);
  } catch (error) {
    console.error("Error fetching ledgers by party:", error);
    res.status(500).json({ message: "Error fetching ledgers by party.", error });
  }
};

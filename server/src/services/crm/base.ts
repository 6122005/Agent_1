export interface CRMContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  lastActivityDate?: string;
}

export interface CRMProvider {
  getContact(email: string): Promise<CRMContact | null>;
  createOrUpdateContact(data: { name: string; email: string; phone?: string }): Promise<CRMContact>;
  logInteraction(contactId: string, note: string): Promise<void>;
  listStaleLeads(daysInactive: number): Promise<CRMContact[]>;
}

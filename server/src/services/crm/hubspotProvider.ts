import axios from 'axios';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { CRMProvider, CRMContact } from './base.js';

export class HubSpotProvider implements CRMProvider {
  private token = env.HUBSPOT_PRIVATE_APP_TOKEN;
  private baseUrl = 'https://api.hubapi.com';

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async getContact(email: string): Promise<CRMContact | null> {
    if (!this.token) {
      logger.warn('HUBSPOT_PRIVATE_APP_TOKEN not configured.');
      return null;
    }

    try {
      const res = await axios.post(
        `${this.baseUrl}/crm/v3/objects/contacts/search`,
        {
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
          properties: ['firstname', 'lastname', 'email', 'phone', 'notes_last_updated', 'lastmodifieddate'],
        },
        { headers: this.headers }
      );

      const contact = res.data.results?.[0];
      if (!contact) return null;

      const name = `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim() || contact.properties.email;
      return {
        id: contact.id,
        name,
        email: contact.properties.email,
        phone: contact.properties.phone,
        lastActivityDate: contact.properties.notes_last_updated || contact.properties.lastmodifieddate,
      };
    } catch (err: any) {
      logger.error('Failed to search HubSpot contact', { error: err.response?.data || err.message });
      return null;
    }
  }

  async createOrUpdateContact(data: { name: string; email: string; phone?: string }): Promise<CRMContact> {
    if (!this.token) {
      return { id: 'mock-hubspot-id', name: data.name, email: data.email, phone: data.phone };
    }

    const nameParts = data.name.split(' ');
    const firstname = nameParts[0] || '';
    const lastname = nameParts.slice(1).join(' ') || '';

    try {
      const existing = await this.getContact(data.email);
      if (existing) {
        // Update contact
        await axios.patch(
          `${this.baseUrl}/crm/v3/objects/contacts/${existing.id}`,
          {
            properties: {
              firstname,
              lastname,
              phone: data.phone || existing.phone,
            },
          },
          { headers: this.headers }
        );
        return { ...existing, name: data.name, phone: data.phone || existing.phone };
      }

      // Create new contact
      const res = await axios.post(
        `${this.baseUrl}/crm/v3/objects/contacts`,
        {
          properties: {
            email: data.email,
            firstname,
            lastname,
            phone: data.phone,
          },
        },
        { headers: this.headers }
      );

      return {
        id: res.data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
      };
    } catch (err: any) {
      logger.error('Failed to create/update HubSpot contact', { error: err.response?.data || err.message });
      throw new Error(`HubSpot sync failed: ${err.message}`);
    }
  }

  async logInteraction(contactId: string, note: string): Promise<void> {
    if (!this.token) return;

    try {
      // Create an engagement note in HubSpot
      await axios.post(
        `${this.baseUrl}/crm/v3/objects/notes`,
        {
          properties: {
            hs_timestamp: new Date().toISOString(),
            hs_note_body: note,
          },
          associations: [
            {
              to: { id: contactId },
              types: [
                {
                  associationCategory: 'HUBSPOT_DEFINED',
                  associationTypeId: 202, // Note to Contact
                },
              ],
            },
          ],
        },
        { headers: this.headers }
      );
      logger.info('Interaction logged in HubSpot', { contactId });
    } catch (err: any) {
      logger.error('Failed to log interaction in HubSpot', { error: err.response?.data || err.message });
    }
  }

  async listStaleLeads(daysInactive = 7): Promise<CRMContact[]> {
    if (!this.token) return [];

    const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000).toISOString();

    try {
      const res = await axios.post(
        `${this.baseUrl}/crm/v3/objects/contacts/search`,
        {
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'lastmodifieddate',
                  operator: 'LT',
                  value: cutoffDate,
                },
              ],
            },
          ],
          properties: ['firstname', 'lastname', 'email', 'phone', 'lastmodifieddate'],
          limit: 10,
        },
        { headers: this.headers }
      );

      return (res.data.results || []).map((c: any) => ({
        id: c.id,
        name: `${c.properties.firstname || ''} ${c.properties.lastname || ''}`.trim() || c.properties.email,
        email: c.properties.email,
        phone: c.properties.phone,
        lastActivityDate: c.properties.lastmodifieddate,
      }));
    } catch (err: any) {
      logger.error('Failed to list stale leads from HubSpot', { error: err.response?.data || err.message });
      return [];
    }
  }
}

export const hubspotProvider = new HubSpotProvider();

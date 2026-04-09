import api from './client';

export interface CompanySettings {
  id: string;
  companyName: string;
  logoUrl?: string;
  primaryColor?: string; // hex color (e.g., #2F81F7)
  createdAt: string;
  updatedAt: string;
}

const BASE_URL = '/company-settings';

export const companySettingsApi = {
  /**
   * Récupérer les paramètres de l'entreprise
   * GET /company-settings (JWT requis)
   */
  getCompanySettings: async (): Promise<CompanySettings> => {
    const response = await api.get<CompanySettings>(`${BASE_URL}`);
    return response.data;
  },

  /**
   * Mettre à jour les paramètres de l'entreprise
   * PATCH /company-settings (ADMIN seulement)
   */
  updateCompanySettings: async (
    settings: Partial<CompanySettings>
  ): Promise<CompanySettings> => {
    const response = await api.patch<CompanySettings>(`${BASE_URL}`, settings);
    return response.data;
  },
};

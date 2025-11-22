import { CrearVersionData } from './types';

export const getTodayYYMMDD = (): string => {
  const now = new Date();
  const yy = String(now.getFullYear() % 100).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
};

export const crearCorreoHtml = (formData: CrearVersionData, md5Aumento?: string, carpetaOneDrive?: string | null) => {
  const subject = `SOLICITUD DE FIRMA ${formData.nombreVersionCliente || ''}${formData.versionBase || ''}_${formData.build || ''} ${formData.terminal || ''} | ${formData.cliente || ''}`;

  const body = `
<div style="font-family: 'Calibri Light', Calibri, Arial, sans-serif; font-size: 12pt; color: #000000;">
  <p>Cordial saludo,</p>
  <p>Espero que te encuentres muy bien. Mediante el presente, realizo la entrega formal de la versión <strong>${formData.nombreVersionCliente || ''}${formData.versionBase || ''}_${formData.build || ''}</strong> para su respectiva firma.</p>

  <p><strong>Detalles:</strong></p>
  <ul style="margin-top: 6px;">
    <li style="margin-bottom: 12px;"><strong>VERSIÓN - ${formData.nombreVersionCliente || ''}${formData.versionBase || ''}</strong>
      <ul style="list-style-type: circle; margin-top: 6px;">
        <li><strong>Terminal:</strong> ${formData.terminal || ''}</li>
        <li><strong>Tipo de firma:</strong> ${formData.tipoFirma === 'personalizada' ? 'Personalizada' : 'Genérica'}</li>
        <li><strong>CID:</strong> ${formData.cid || '0'}</li>
        <li><strong>Nombre del archivo:</strong> ${formData.nombreArchivoBin || formData.nombrePkg || ''}</li>
        <li><strong>Checksum (MD5):</strong> ${formData.checksumBase || formData.checksumPkg || ''}</li>
      </ul>
    </li>
    ${md5Aumento ? `
    <li style="margin-top:18px; margin-bottom:8px; padding-top:12px; border-top:1px solid #e5e7eb;"><strong>VERSIÓN DE AUMENTO - ${formData.nombreVersionCliente || ''}${formData.versionAumento || ''}</strong>
      <ul style="list-style-type: circle; margin-top: 6px;">
        <li><strong>Terminal:</strong> ${formData.terminal || ''}</li>
        <li><strong>Tipo de firma:</strong> ${formData.tipoFirma === 'personalizada' ? 'Personalizada' : 'Genérica'}</li>
        <li><strong>CID:</strong> ${formData.cid || '0'}</li>
        <li><strong>Nombre del archivo:</strong> ${formData.nombreArchivoBin || formData.nombrePkg || ''}</li>
        <li><strong>Checksum (MD5):</strong> ${md5Aumento}</li>
      </ul>
    </li>` : ''}
  </ul>
  ${carpetaOneDrive ? `<p>Archivos en OneDrive: ${carpetaOneDrive}</p>` : ''}
</div>`;

  return { subject, body };
};

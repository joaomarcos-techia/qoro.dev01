
'use client';
import { QuoteProfile } from '@/ai/schemas';
import React from 'react';

type DocumentProfile = QuoteProfile;

interface DocumentPDFProps {
    document: DocumentProfile;
}

export const DocumentPDF = React.forwardRef<HTMLDivElement, DocumentPDFProps>(({ document }, ref) => {
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatDate = (date: string | Date) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('pt-BR').format(dateObj);
    }
    
    const title = 'Orçamento';
    const validUntilDate = document.validUntil;
    const organizationName = document.organizationName || 'Sua Empresa';
    const discountAmount = document.subtotal * ((document.discount || 0) / 100);


    return (
        <div ref={ref} className="bg-white p-0" style={{ width: '210mm', minHeight: '297mm'}}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                .pdf-container { font-family: 'Inter', sans-serif; font-size: 11px; line-height: 1.6; color: #374151; background-color: #fff; padding: 15mm; }
                .pdf-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f3f4f6; padding-bottom: 1rem; margin-bottom: 1.5rem; }
                .pdf-header .logo h1 { font-size: 1.8rem; font-weight: 700; color: #111827; margin: 0; }
                .pdf-header .quote-details { text-align: right; }
                .pdf-header .quote-details h2 { font-size: 1.5rem; color: #8B5CF6; margin: 0 0 0.25rem 0; font-weight: 600; }
                .pdf-header .quote-details p { margin: 0; color: #4b5563; }
                .customer-info { margin-bottom: 1.5rem; padding: 1rem; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
                .customer-info h3 { font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem 0; color: #111827; }
                .customer-info p { margin: 0; color: #374151; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
                .items-table th, .items-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
                .items-table th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; }
                .items-table .item-name { font-weight: 600; color: #1f2937; }
                .items-table .align-right { text-align: right; }
                .items-table .align-center { text-align: center; }
                .totals-section { display: flex; justify-content: flex-end; }
                .totals-table { width: 40%; }
                .totals-table td { padding: 0.6rem 1rem; }
                .totals-table .label { text-align: right; font-weight: 600; color: #4b5563; }
                .totals-table .value { text-align: right; }
                .totals-table .grand-total { font-size: 1.1rem; font-weight: 700; border-top: 2px solid #e5e7eb; }
                .grand-total .label, .grand-total .value { color: #111827; }
                .notes-section { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }
                .notes-section h4 { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; }
                .notes-section p { white-space: pre-wrap; font-size: 0.8rem; color: #4b5563; }
                .pdf-footer { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; text-align: center; font-size: 0.75rem; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 0.5rem; }
            `}</style>
            <div className="pdf-container">
                <header className="pdf-header">
                    <div className="logo">
                        <h1>{organizationName}</h1>
                    </div>
                    <div className="quote-details">
                        <h2>{title}</h2>
                        <p><strong>Número:</strong> {document.number}</p>
                        <p><strong>Data:</strong> {formatDate(document.createdAt)}</p>
                        {validUntilDate && <p><strong>Válido até:</strong> {formatDate(validUntilDate)}</p>}
                    </div>
                </header>
                <section className="customer-info">
                    <h3>Para:</h3>
                    <p><strong>{document.customerName}</strong></p>
                </section>
                <section>
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th className="item-name">Descrição do Item</th>
                                <th className="align-center">Qtd.</th>
                                <th className="align-right">Preço Unit.</th>
                                <th className="align-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {document.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="item-name">{item.name}</td>
                                    <td className="align-center">{item.quantity}</td>
                                    <td className="align-right">{formatCurrency(item.unitPrice)}</td>
                                    <td className="align-right">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                <section className="totals-section">
                     <table className="totals-table">
                        <tbody>
                            <tr>
                                <td className="label">Subtotal:</td>
                                <td className="value">{formatCurrency(document.subtotal)}</td>
                            </tr>
                             <tr>
                                <td className="label">Desconto ({document.discount || 0}%):</td>
                                <td className="value">{formatCurrency(discountAmount)}</td>
                            </tr>
                            <tr className="grand-total">
                                <td className="label">TOTAL:</td>
                                <td className="value">{formatCurrency(document.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
                {document.notes && (
                    <section className="notes-section">
                        <h4>Observações e Termos:</h4>
                        <p>{document.notes}</p>
                    </section>
                )}
                <footer className="pdf-footer">
                    Agradecemos pela oportunidade e ficamos à disposição para qualquer esclarecimento.
                </footer>
            </div>
        </div>
    );
});

DocumentPDF.displayName = 'DocumentPDF';

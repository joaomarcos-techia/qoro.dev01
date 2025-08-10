'use client';
import { QuoteProfile } from '@/ai/schemas';
import React from 'react';

interface QuotePDFProps {
    quote: QuoteProfile;
}

export const QuotePDF = React.forwardRef<HTMLDivElement, QuotePDFProps>(({ quote }, ref) => {
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div ref={ref}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
                :root { --primary: #1a1a1a; --secondary: #2c2c2c; --accent: #1d3c78; --accent-light: #e8edf7; --accent-dark: #142a5e; --success: #2e7d32; --warning: #ed6c02; --error: #d32f2f; --gray-50: #fafafa; --gray-100: #f5f5f5; --gray-200: #eeeeee; --gray-300: #e0e0e0; --gray-400: #bdbdbd; --gray-500: #9e9e9e; --gray-600: #757575; --gray-700: #616161; --gray-800: #424242; --gray-900: #212121; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                .proposal-pdf-body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 14px; line-height: 1.6; color: var(--gray-800); background: #f0f2f5; font-weight: 400; padding: 20px; }
                .proposal { max-width: 794px; width: 100%; min-height: 1123px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); position: relative; overflow: hidden; }
                .watermark { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.05; z-index: 0; pointer-events: none; background-image: repeating-linear-gradient(45deg, transparent, transparent 200px, rgba(0, 0, 0, 0.03) 200px, rgba(0, 0, 0, 0.03) 400px); }
                .watermark::before { content: "PROPOSTA COMERCIAL"; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 5rem; font-weight: 900; color: var(--accent); opacity: 0.1; letter-spacing: 2px; white-space: nowrap; }
                .header { background: var(--accent); color: white; padding: 2.5rem 2.5rem 1.5rem; position: relative; z-index: 1; }
                .header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: var(--accent-dark); }
                .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
                .logo-section h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.25rem; letter-spacing: -0.02em; }
                .logo-section .tagline { font-size: 0.875rem; opacity: 0.85; font-weight: 400; color: #dbeafe; }
                .proposal-info { text-align: right; font-size: 0.875rem; padding: 0.8rem 1.2rem; background: rgba(0, 0, 0, 0.15); border-radius: 4px; }
                .proposal-number { font-weight: 600; margin-bottom: 0.25rem; font-size: 1rem; color: white; }
                .proposal-date { opacity: 0.9; font-size: 0.85rem; color: #e0f2fe; }
                .header-title { position: relative; z-index: 1; padding: 1rem 0; }
                .header-title h2 { font-size: 2.25rem; font-weight: 300; margin-bottom: 0.5rem; letter-spacing: -0.04em; color: white; }
                .header-title p { font-size: 1.125rem; opacity: 0.9; font-weight: 400; color: #dbeafe; max-width: 80%; }
                .content { padding: 2rem; position: relative; z-index: 1; }
                .section { margin-bottom: 2rem; }
                .section-title { font-size: 1.15rem; font-weight: 600; color: var(--accent); margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 2px solid var(--accent); position: relative; text-transform: uppercase; letter-spacing: 0.05em; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
                .info-card { background: white; border: 1px solid var(--gray-200); border-radius: 4px; padding: 1.5rem; border-left: 4px solid var(--accent); box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .info-card h3 { font-size: 1rem; font-weight: 600; color: var(--accent); margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: 0.05em; }
                .info-item { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.25rem; }
                .info-item:last-child { margin-bottom: 0; }
                .info-label { font-size: 0.75rem; font-weight: 600; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.1em; }
                .info-value { font-size: 0.95rem; font-weight: 500; color: var(--gray-800); padding: 0.25rem 0; border-bottom: 1px solid var(--gray-100); }
                .items-table { width: 100%; border-collapse: collapse; border: 1px solid var(--gray-200); border-radius: 4px; overflow: hidden; margin-bottom: 1rem; background: white; font-size: 0.85rem; }
                .items-table th { background: var(--accent); color: white; font-weight: 600; padding: 0.9rem 1rem; text-align: left; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.8rem; }
                .items-table td { padding: 1rem; border-bottom: 1px solid var(--gray-100); font-size: 0.85rem; vertical-align: top; }
                .items-table tbody tr:nth-child(even) { background: var(--gray-50); }
                .items-table .quantity { text-align: center; font-weight: 600; color: var(--accent); }
                .items-table .price { text-align: right; font-weight: 600; color: var(--accent); font-family: 'Inter', monospace; }
                .items-table td strong { color: var(--primary); font-weight: 600; }
                .totals { margin-top: 1rem; background: white; border: 1px solid var(--gray-200); border-radius: 4px; overflow: hidden; width: 60%; margin-left: auto; }
                .total-row { display: flex; justify-content: space-between; align-items: center; padding: 0.9rem 1.5rem; font-size: 0.95rem; border-bottom: 1px solid var(--gray-100); }
                .total-row:last-child { border-bottom: none; }
                .total-row:nth-child(even) { background: var(--gray-50); }
                .total-row.final { font-size: 1.25rem; font-weight: 700; color: white; background: var(--accent); border: none; margin: 0; padding: 1.25rem; }
                .total-row span:last-child { font-family: 'Inter', monospace; font-weight: 600; }
                .validity { background: var(--accent-light); color: var(--accent-dark); padding: 1rem 1.5rem; border-radius: 4px; text-align: center; font-weight: 600; margin-top: 1.5rem; font-size: 0.95rem; border: 1px solid var(--accent); }
            `}</style>
            <div className="proposal">
                <div className="watermark"></div>
                <div className="header">
                    <div className="header-top">
                        <div className="logo-section"><h1>Sua Empresa</h1><div className="tagline">Seu Slogan</div></div>
                        <div className="proposal-info">
                            <div className="proposal-number">Proposta Nº {quote.number}</div>
                            <div className="proposal-date">{new Date(quote.createdAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div className="header-title"><h2>Proposta Comercial</h2><p>Proposta para {quote.customerName}</p></div>
                </div>
                <div className="content">
                    <div className="section">
                        <h3 className="section-title">Informações de Contato</h3>
                    </div>
                    <div className="section">
                        <h3 className="section-title">Itens e Valores</h3>
                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th>Item/Serviço</th>
                                    <th>Qtd</th>
                                    <th>Valor Unit.</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quote.items.map(item => (
                                    <tr key={item.itemId}>
                                        <td><strong>{item.name}</strong></td>
                                        <td className="quantity">{item.quantity}</td>
                                        <td className="price">{formatCurrency(item.unitPrice)}</td>
                                        <td className="price">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="totals">
                            <div className="total-row"><span>Subtotal</span><span>{formatCurrency(quote.subtotal)}</span></div>
                            <div className="total-row"><span>Desconto</span><span>- {formatCurrency(quote.discount || 0)}</span></div>
                            <div className="total-row"><span>Impostos</span><span>{formatCurrency(quote.tax || 0)}</span></div>
                            <div className="total-row final"><span>TOTAL GERAL</span><span>{formatCurrency(quote.total)}</span></div>
                        </div>
                    </div>
                    <div className="section">
                        <h3 className="section-title">Termos e Condições</h3>
                        <div className="contract-terms" style={{ whiteSpace: 'pre-wrap' }}>{quote.notes}</div>
                    </div>
                    <div className="validity">Esta proposta tem validade até {new Date(quote.validUntil).toLocaleDateString()}</div>
                </div>
            </div>
        </div>
    );
});

QuotePDF.displayName = 'QuotePDF';

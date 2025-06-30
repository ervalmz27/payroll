import { PrismaClient, Payslip, User } from '@prisma/client';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

import * as pdfFonts from 'pdfmake/build/vfs_fonts';

const prisma = new PrismaClient();

// Use default system fonts that are always available
const fonts = {
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

const printer = new PdfPrinter(fonts);

const payslipService = {

    async getPayslipsForUser(userId: number): Promise<Payslip[]> {

        return await prisma.payslip.findMany({
            where: { userId: userId },
            select: {
                id: true,
                userId: true,
                payrollProcessId: true,
                period: true,
                grossSalary: true,
                totalAllowances: true,
                overtime: true,
                totalDeductions: true,
                netSalary: true,
                taxAmount: true,
                bpjsKesehatanAmount: true,
                bpjsKetenagakerjaanAmount: true,
                status: true,
                details: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                        department: true,
                        position: true,
                        npwp: true,
                        username: true,
                        joinDate: true,
                    },
                },
            },
            orderBy: { period: 'desc' },
        });
    },

    async getAllPayslips(): Promise<Payslip[]> {
        return await prisma.payslip.findMany({
            select: {
                id: true,
                userId: true,
                payrollProcessId: true,
                period: true,
                grossSalary: true,
                totalAllowances: true,
                overtime: true,
                totalDeductions: true,
                netSalary: true,
                taxAmount: true,
                bpjsKesehatanAmount: true,
                bpjsKetenagakerjaanAmount: true,
                status: true,
                details: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                        department: true,
                        position: true,
                        npwp: true,
                        username: true,
                        joinDate: true,
                    },
                },
            },
            orderBy: { period: 'desc' },
        });
    },

    async getPayslipById(payslipId: number): Promise<Payslip | null> {
        return await prisma.payslip.findUnique({
            where: { id: payslipId },
            select: {
                id: true,
                userId: true,
                payrollProcessId: true,
                period: true,
                grossSalary: true,
                totalAllowances: true,
                overtime: true,
                totalDeductions: true,
                netSalary: true,
                taxAmount: true,
                bpjsKesehatanAmount: true,
                bpjsKetenagakerjaanAmount: true,
                status: true,
                details: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                        department: true,
                        position: true,
                        npwp: true,
                        username: true,
                        joinDate: true,
                    },
                },
            },
        });
    },

    async generatePayslipPdf(payslip: Payslip & { user: User }): Promise<Buffer> {
        const periodMonthYear = new Date(payslip.period).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        const docDefinition: TDocumentDefinitions = {
            content: [
                { text: 'PT Sarana Amal Indonesia', style: 'header' },
                { text: `Slip Gaji - ${periodMonthYear}`, style: 'subheader' },
                { text: '\n' },
                {
                    columns: [
                        {
                            width: '50%',
                            stack: [
                                { text: 'Informasi Karyawan', style: 'sectionHeader' },
                                { text: `Nama: ${payslip.user?.name || 'N/A'}`, margin: [0, 5] },
                                { text: `Email: ${payslip.user?.email || 'N/A'}`, margin: [0, 5] },
                                { text: `NIK: ${payslip.user?.username || 'N/A'}`, margin: [0, 5] },
                                { text: `Posisi: ${payslip.user?.position || '-'}`, margin: [0, 5] },
                                { text: `Departemen: ${payslip.user?.department || '-'}`, margin: [0, 5] },
                                { text: `Tanggal Bergabung: ${new Date(payslip.user?.joinDate || new Date()).toLocaleDateString('id-ID')}`, margin: [0, 5] },
                                { text: `NPWP: ${payslip.user?.npwp || '-'}`, margin: [0, 5] },
                            ],
                        },
                        {
                            width: '50%',
                            stack: [
                                { text: 'Detail Gaji', style: 'sectionHeader' },
                                { text: `Gaji Pokok: Rp ${payslip.grossSalary != null ? Number(payslip.grossSalary).toLocaleString('id-ID') : '0'}`, margin: [0, 5] },
                                { text: `Tunjangan: Rp ${payslip.totalAllowances != null ? Number(payslip.totalAllowances).toLocaleString('id-ID') : '0'}`, margin: [0, 5] },
                                { text: `Lembur: Rp ${payslip.overtime != null ? Number(payslip.overtime).toLocaleString('id-ID') : '0'}`, margin: [0, 5] },
                                { text: `Potongan Lain-lain: Rp ${payslip.totalDeductions != null ? Number(payslip.totalDeductions).toLocaleString('id-ID') : '0'}`, margin: [0, 5] },
                                { text: '\n' },
                                { text: `PPh 21: -Rp ${payslip.taxAmount != null ? Number(payslip.taxAmount).toLocaleString('id-ID') : '0'}`, color: 'red', margin: [0, 5] },
                                { text: `BPJS Kesehatan: -Rp ${payslip.bpjsKesehatanAmount != null ? Number(payslip.bpjsKesehatanAmount).toLocaleString('id-ID') : '0'}`, color: 'red', margin: [0, 5] },
                                { text: `BPJS Ketenagakerjaan: -Rp ${payslip.bpjsKetenagakerjaanAmount != null ? Number(payslip.bpjsKetenagakerjaanAmount).toLocaleString('id-ID') : '0'}`, color: 'red', margin: [0, 5] },
                                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 200, y2: 5, lineWidth: 1 }] },
                                { text: `Gaji Bersih: Rp ${payslip.netSalary != null ? Number(payslip.netSalary).toLocaleString('id-ID') : '0'}`, style: 'netSalary' },
                            ],
                        },
                    ],
                },
                { text: '\n' },
                { text: 'Detail Tambahan (jika ada):', style: 'sectionHeader' },
                { text: JSON.stringify(payslip.details || {}, null, 2), fontSize: 10, margin: [0, 5] },
            ],
            styles: {
                header: {
                    fontSize: 20,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 0, 0, 10],
                    font: 'Helvetica'
                },
                subheader: {
                    fontSize: 16,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 0, 0, 10],
                    font: 'Helvetica'
                },
                sectionHeader: {
                    fontSize: 14,
                    bold: true,
                    margin: [0, 10, 0, 5],
                    font: 'Helvetica'
                },
                netSalary: {
                    fontSize: 18,
                    bold: true,
                    alignment: 'right',
                    color: 'green',
                    margin: [0, 10, 0, 0],
                    font: 'Helvetica'
                },
            },
            defaultStyle: {
                font: 'Helvetica'
            },
            pageMargins: [40, 40, 40, 40],
        };

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        return new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err) => reject(err));
            pdfDoc.end();
        });
    },
};

export default payslipService;
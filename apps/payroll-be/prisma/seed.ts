// prisma/seed.ts
import { PrismaClient, Prisma } from '@prisma/client';
import { hashPassword } from '../src/utils/password'; // Pastikan path benar

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seeding process...');

    // --- 1. Buat atau Perbarui User Admin (Manager HR) ---
    const adminEmail = 'admin@company.com';
    const hashedPasswordAdmin = await hashPassword('admin123');
    let adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedPasswordAdmin, // Update password jika berubah
            name: 'Administrator',
            department: 'Management',
            position: 'CEO',
            status: 'active',
        },
        create: {
            username: 'admin',
            email: adminEmail,
            password: hashedPasswordAdmin,
            name: 'Administrator',
            department: 'Management',
            position: 'CEO',
            joinDate: new Date('2023-01-01T00:00:00Z'),
            status: 'active',
            roles: {
                create: [{ role: 'Manager HR' }], // Beri peran Manager HR
            },
        },
        include: { roles: true },
    });
    console.log(`Created/Updated user: ${adminUser.username} with roles: ${adminUser.roles.map(r => r.role).join(', ')}`);

    // --- 2. Buat atau Perbarui User Staff HR ---
    const staffHREmail = 'staffhr@company.com';
    const hashedPasswordStaffHR = await hashPassword('staffhr123');
    let staffHRUser = await prisma.user.upsert({
        where: { email: staffHREmail },
        update: {
            password: hashedPasswordStaffHR,
            name: 'Dedi Kurniawan', // Nama sesuai mock di frontend
            department: 'Human Resources',
            position: 'Staff HR',
            status: 'active',
        },
        create: {
            username: 'staffhr',
            email: staffHREmail,
            password: hashedPasswordStaffHR,
            name: 'Dedi Kurniawan',
            department: 'Human Resources',
            position: 'Staff HR',
            joinDate: new Date('2023-02-01T00:00:00Z'),
            status: 'active',
            roles: {
                create: [{ role: 'Staff HR' }], // Beri peran Staff HR
            },
        },
        include: { roles: true },
    });
    console.log(`Created/Updated user: ${staffHRUser.username} with roles: ${staffHRUser.roles.map(r => r.role).join(', ')}`);

    // --- 3. Buat atau Perbarui User Staff Finance ---
    const staffFinanceEmail = 'stafffinance@company.com';
    const hashedPasswordStaffFinance = await hashPassword('stafffinance123');
    let staffFinanceUser = await prisma.user.upsert({
        where: { email: staffFinanceEmail },
        update: {
            password: hashedPasswordStaffFinance,
            name: 'Budi Santoso', // Nama sesuai mock di frontend
            department: 'Finance',
            position: 'Staff Finance',
            status: 'active',
        },
        create: {
            username: 'stafffinance',
            email: staffFinanceEmail,
            password: hashedPasswordStaffFinance,
            name: 'Budi Santoso',
            department: 'Finance',
            position: 'Staff Finance',
            joinDate: new Date('2023-03-01T00:00:00Z'),
            status: 'active',
            roles: {
                create: [{ role: 'Staff Finance' }], // Beri peran Staff Finance
            },
        },
        include: { roles: true },
    });
    console.log(`Created/Updated user: ${staffFinanceUser.username} with roles: ${staffFinanceUser.roles.map(r => r.role).join(', ')}`);

    // --- 4. Buat atau Perbarui User Karyawan (Maya Sari) ---
    const mayaSariEmail = 'maya@example.com';
    const hashedPasswordMayaSari = await hashPassword('maya123');
    let mayaSari = await prisma.user.upsert({
        where: { email: mayaSariEmail },
        update: {
            password: hashedPasswordMayaSari,
            name: 'Maya Sari',
            department: 'IT',
            position: 'Developer',
            status: 'active',
        },
        create: {
            username: 'mayasari',
            email: mayaSariEmail,
            password: hashedPasswordMayaSari,
            name: 'Maya Sari',
            department: 'IT',
            position: 'Developer',
            joinDate: new Date('2023-01-15T00:00:00Z'),
            status: 'active',
            roles: {
                create: [{ role: 'Karyawan' }],
            },
        },
        include: { roles: true },
    });
    console.log(`Created/Updated user: ${mayaSari.username} with roles: ${mayaSari.roles.map(r => r.role).join(', ')}`);

    // --- 5. Buat atau Perbarui User Karyawan (Nidal Abdillah - dari laporan lain jika relevan) ---
    const nidalEmail = 'nanda@company.com';
    const hashedPasswordNidal = await hashPassword('nanda123');
    let nandaUSer = await prisma.user.upsert({
        where: { email: nidalEmail },
        update: {
            password: hashedPasswordNidal,
            name: 'Nanda sunanda',
            department: 'Research',
            position: 'Intern',
            status: 'active',
        },
        create: {
            username: 'nanda',
            email: nidalEmail,
            password: hashedPasswordNidal,
            name: 'nanda sunanda',
            department: 'Research',
            position: 'Intern',
            joinDate: new Date('2024-06-01T00:00:00Z'),
            status: 'active',
            roles: {
                create: [{ role: 'Karyawan' }],
            },
        },
        include: { roles: true },
    });
    console.log(`Created/Updated user: ${nandaUSer.username} with roles: ${nandaUSer.roles.map(r => r.role).join(', ')}`);

    const payrollProcessJune = await prisma.payrollProcess.upsert({
        where: { payrollPeriod: new Date('2024-06-01T00:00:00Z') },
        update: {
            paymentDate: new Date('2024-06-30T00:00:00Z'),
            totalEmployees: 2, // Sekarang ada 2 karyawan yang akan punya payslip
            processedCount: 2,
            pendingCount: 0,
            status: 'Completed',
            startedByUserId: adminUser.id, // Gunakan adminUser dari upsert
        },
        create: {
            payrollPeriod: new Date('2024-06-01T00:00:00Z'),
            paymentDate: new Date('2024-06-30T00:00:00Z'),
            totalEmployees: 2,
            processedCount: 2,
            pendingCount: 0,
            status: 'Completed',
            startedByUserId: adminUser.id,
        },
    });
    console.log('Created/Updated PayrollProcess for June 2024.');

    // --- 7. Buat Payslip dummy untuk Maya Sari ---
    if (mayaSari) {
        await prisma.payslip.upsert({
            where: {
                userId_period_payrollProcessId: {
                    userId: mayaSari.id,
                    period: new Date('2024-06-01T00:00:00Z'),
                    payrollProcessId: payrollProcessJune.id,
                },
            },
            update: {
                grossSalary: new Prisma.Decimal(10750000),
                totalAllowances: new Prisma.Decimal(1500000),
                overtime: new Prisma.Decimal(750000),
                totalDeductions: new Prisma.Decimal(1200000),
                netSalary: new Prisma.Decimal(9550000),
                taxAmount: new Prisma.Decimal(850000),
                bpjsKesehatanAmount: new Prisma.Decimal(200000),
                bpjsKetenagakerjaanAmount: new Prisma.Decimal(150000),
                status: 'Processed',
                details: {
                    basic: 8500000,
                    tunjanganMakan: 500000,
                    tunjanganTransport: 1000000,
                    lemburRate: 50000,
                    jamLembur: 15,
                },
            },
            create: {
                userId: mayaSari.id,
                payrollProcessId: payrollProcessJune.id,
                period: new Date('2024-06-01T00:00:00Z'),
                grossSalary: new Prisma.Decimal(10750000),
                totalAllowances: new Prisma.Decimal(1500000),
                overtime: new Prisma.Decimal(750000),
                totalDeductions: new Prisma.Decimal(1200000),
                netSalary: new Prisma.Decimal(9550000),
                taxAmount: new Prisma.Decimal(850000),
                bpjsKesehatanAmount: new Prisma.Decimal(200000),
                bpjsKetenagakerjaanAmount: new Prisma.Decimal(150000),
                status: 'Processed',
                details: {
                    basic: 8500000,
                    tunjanganMakan: 500000,
                    tunjanganTransport: 1000000,
                    lemburRate: 50000,
                    jamLembur: 15,
                },
            },
        });
        console.log('Created/Updated Payslip for Maya Sari - June 2024.');
    } else {
        console.warn('Maya Sari user not found, skipping Payslip creation for Maya Sari.');
    }

    // --- 8. Buat Payslip dummy untuk Nidal Abdillah ---
    if (nandaUSer) {
        // Buat PayrollProcess dummy untuk Nidal (jika berbeda periode atau proses)
        const payrollProcessMay = await prisma.payrollProcess.upsert({
            where: { payrollPeriod: new Date('2024-05-01T00:00:00Z') },
            update: {
                paymentDate: new Date('2024-05-31T00:00:00Z'),
                totalEmployees: 1,
                processedCount: 1,
                pendingCount: 0,
                status: 'Completed',
                startedByUserId: adminUser.id,
            },
            create: {
                payrollPeriod: new Date('2024-05-01T00:00:00Z'),
                paymentDate: new Date('2024-05-31T00:00:00Z'),
                totalEmployees: 1,
                processedCount: 1,
                pendingCount: 0,
                status: 'Completed',
                startedByUserId: adminUser.id,
            },
        });
        console.log('Created/Updated PayrollProcess for May 2024.');

        await prisma.payslip.upsert({
            where: {
                userId_period_payrollProcessId: {
                    userId: nandaUSer.id,
                    period: new Date('2024-05-01T00:00:00Z'),
                    payrollProcessId: payrollProcessMay.id,
                },
            },
            update: {
                grossSalary: new Prisma.Decimal(5000000),
                totalAllowances: new Prisma.Decimal(500000),
                overtime: new Prisma.Decimal(0),
                totalDeductions: new Prisma.Decimal(300000),
                netSalary: new Prisma.Decimal(5200000),
                taxAmount: new Prisma.Decimal(200000),
                bpjsKesehatanAmount: new Prisma.Decimal(100000),
                bpjsKetenagakerjaanAmount: new Prisma.Decimal(50000),
                status: 'Processed',
                details: {
                    basic: 4500000,
                    tunjanganTransport: 500000,
                },
            },
            create: {
                userId: nandaUSer.id,
                payrollProcessId: payrollProcessMay.id,
                period: new Date('2024-05-01T00:00:00Z'),
                grossSalary: new Prisma.Decimal(5000000),
                totalAllowances: new Prisma.Decimal(500000),
                overtime: new Prisma.Decimal(0),
                totalDeductions: new Prisma.Decimal(300000),
                netSalary: new Prisma.Decimal(5200000),
                taxAmount: new Prisma.Decimal(200000),
                bpjsKesehatanAmount: new Prisma.Decimal(100000),
                bpjsKetenagakerjaanAmount: new Prisma.Decimal(50000),
                status: 'Processed',
                details: {
                    basic: 4500000,
                    tunjanganTransport: 500000,
                },
            },
        });
        console.log('Created/Updated Payslip for Nidal Abdillah - May 2024.');
    } else {
        console.warn('Nidal Abdillah user not found, skipping Payslip creation for Nidal Abdillah.');
    }

    console.log('Seeding process completed.');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
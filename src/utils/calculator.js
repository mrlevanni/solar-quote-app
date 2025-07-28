class SolarCalculator {
    constructor(dataReader) {
        this.dataReader = dataReader;
    }

    // Tính toán hệ thống solar dựa trên yêu cầu khách hàng
    calculateSystem(customerData) {
        const {
            customerName,
            customerPhone,
            customerAddress,
            monthlyBill,
            monthlyConsumption,
            electricityPrice = 2500,
            savingsPercent,
            morningUsage,
            eveningUsage
        } = customerData;

        // Tính toán nhu cầu điện năng
        const actualMonthlyConsumption = monthlyConsumption || this.estimateMonthlyConsumption(monthlyBill, electricityPrice);
        const dailyConsumption = actualMonthlyConsumption / 30;
        const targetSavings = actualMonthlyConsumption * (savingsPercent / 100);
        
        // Tính toán công suất hệ thống cần thiết
        const systemPowerKW = this.calculateRequiredPower(targetSavings);
        
        // Tính phân bổ sử dụng điện
        const morningConsumption = dailyConsumption * (morningUsage / 100);
        const eveningConsumption = dailyConsumption * (eveningUsage / 100);
        
        // Chọn thiết bị phù hợp
        const systemConfig = this.selectOptimalComponents(systemPowerKW, eveningConsumption);
        
        return {
            customer: {
                name: customerName,
                phone: customerPhone,
                address: customerAddress,
                monthlyBill,
                monthlyConsumption: actualMonthlyConsumption,
                dailyConsumption,
                electricityPrice,
                savingsPercent,
                targetSavings,
                morningUsage: morningConsumption,
                eveningUsage: eveningConsumption
            },
            system: {
                powerKW: systemPowerKW,
                ...systemConfig
            },
            quote: this.generateQuote(systemConfig)
        };
    }

    estimateMonthlyConsumption(monthlyBill, electricityPrice = 2500) {
        // Ước tính tiêu thụ dựa trên hóa đơn tiền điện
        return monthlyBill / electricityPrice;
    }

    calculateRequiredPower(targetSavingsKWh) {
        // Tính công suất cần thiết dựa trên mục tiêu tiết kiệm
        // Giả định 1kW hệ thống tạo ra ~120kWh/tháng ở Việt Nam
        const monthlyProductionPerKW = 120;
        return Math.ceil(targetSavingsKWh / monthlyProductionPerKW);
    }

    selectOptimalComponents(systemPowerKW, eveningConsumptionKWh) {
        const pvPanels = this.dataReader.getPVPanels();
        const inverters = this.dataReader.getInverters();
        const batteries = this.dataReader.getBatteries();
        const accessories = this.dataReader.getAccessories();

        // Chọn tấm pin (chọn loại 450W phổ biến)
        const selectedPV = pvPanels.find(pv => pv.powerW === 450) || pvPanels[0];
        const pvQuantity = Math.ceil((systemPowerKW * 1000) / selectedPV.powerW);

        // Chọn inverter phù hợp với công suất hệ thống
        const selectedInverter = inverters.find(inv => 
            inv.powerKW >= systemPowerKW && inv.powerKW <= systemPowerKW * 1.2
        ) || inverters.find(inv => inv.powerKW >= systemPowerKW) || inverters[0];

        // Chọn pin dựa trên nhu cầu sử dụng buổi tối
        const batteryCapacityNeeded = eveningConsumptionKWh * 1.2; // buffer 20%
        const selectedBattery = batteries.find(bat => 
            bat.capacity >= batteryCapacityNeeded
        ) || batteries[0];
        const batteryQuantity = Math.ceil(batteryCapacityNeeded / selectedBattery.capacity);

        // Chọn phụ kiện cần thiết
        const mounting = accessories.find(acc => acc.code === 'ACC-MOUNT-1');
        const dcCable = accessories.find(acc => acc.code === 'ACC-CABLE-1');
        const acCable = accessories.find(acc => acc.code === 'ACC-CABLE-2');
        const dcBreaker = accessories.find(acc => acc.code === 'ACC-BREAKER-1');
        const acBreaker = accessories.find(acc => acc.code === 'ACC-BREAKER-2');
        const meter = accessories.find(acc => acc.code === 'ACC-METER-1');
        const installation = accessories.find(acc => acc.code === 'ACC-INSTALL-1');

        return {
            pv: {
                item: selectedPV,
                quantity: pvQuantity,
                totalPower: (selectedPV.powerW * pvQuantity) / 1000
            },
            inverter: {
                item: selectedInverter,
                quantity: 1
            },
            battery: {
                item: selectedBattery,
                quantity: batteryQuantity,
                totalCapacity: selectedBattery.capacity * batteryQuantity
            },
            accessories: [
                { item: mounting, quantity: pvQuantity, description: 'Giá đỡ tấm pin' },
                { item: dcCable, quantity: Math.ceil(pvQuantity * 5), description: 'Cáp DC nối tấm pin' },
                { item: acCable, quantity: 50, description: 'Cáp AC' },
                { item: dcBreaker, quantity: 1, description: 'Cầu dao DC' },
                { item: acBreaker, quantity: 1, description: 'Cầu dao AC' },
                { item: meter, quantity: 1, description: 'Đồng hồ 2 chiều' },
                { item: installation, quantity: systemPowerKW, description: 'Chi phí lắp đặt' }
            ]
        };
    }

    generateQuote(systemConfig) {
        const items = [];
        let totalCost = 0;

        // Tấm pin PV
        if (systemConfig.pv && systemConfig.pv.item) {
            const pvCost = systemConfig.pv.item.price * systemConfig.pv.quantity;
            items.push({
                category: 'Tấm pin mặt trời',
                code: systemConfig.pv.item.code,
                name: systemConfig.pv.item.name,
                quantity: systemConfig.pv.quantity,
                unit: 'tấm',
                unitPrice: systemConfig.pv.item.price,
                totalPrice: pvCost,
                warranty: systemConfig.pv.item.warranty + ' năm'
            });
            totalCost += pvCost;
        }

        // Inverter
        if (systemConfig.inverter && systemConfig.inverter.item) {
            const invCost = systemConfig.inverter.item.price * systemConfig.inverter.quantity;
            items.push({
                category: 'Inverter',
                code: systemConfig.inverter.item.code,
                name: systemConfig.inverter.item.name,
                quantity: systemConfig.inverter.quantity,
                unit: 'bộ',
                unitPrice: systemConfig.inverter.item.price,
                totalPrice: invCost,
                warranty: systemConfig.inverter.item.warranty + ' năm'
            });
            totalCost += invCost;
        }

        // Pin lưu trữ
        if (systemConfig.battery && systemConfig.battery.item) {
            const batCost = systemConfig.battery.item.price * systemConfig.battery.quantity;
            items.push({
                category: 'Pin lưu trữ',
                code: systemConfig.battery.item.code,
                name: systemConfig.battery.item.name,
                quantity: systemConfig.battery.quantity,
                unit: 'bộ',
                unitPrice: systemConfig.battery.item.price,
                totalPrice: batCost,
                warranty: systemConfig.battery.item.warranty + ' năm'
            });
            totalCost += batCost;
        }

        // Phụ kiện
        if (systemConfig.accessories && Array.isArray(systemConfig.accessories)) {
            systemConfig.accessories.forEach(acc => {
                if (acc && acc.item && acc.quantity > 0) {
                    const accCost = acc.item.price * acc.quantity;
                    items.push({
                        category: 'Phụ kiện',
                        code: acc.item.code,
                        name: acc.item.name,
                        quantity: acc.quantity,
                        unit: acc.item.unit,
                        unitPrice: acc.item.price,
                        totalPrice: accCost,
                        warranty: acc.item.note || 'Theo nhà sản xuất'
                    });
                    totalCost += accCost;
                }
            });
        }

        return {
            items,
            subtotal: totalCost,
            vat: Math.round(totalCost * 0.1),
            total: Math.round(totalCost * 1.1),
            totalUSD: Math.round(totalCost * 1.1 / 24000), // Quy đổi USD
            installmentOptions: this.calculateInstallments(totalCost * 1.1)
        };
    }

    calculateInstallments(total) {
        return [
            { months: 12, monthlyPayment: Math.round(total / 12) },
            { months: 24, monthlyPayment: Math.round(total / 24) },
            { months: 36, monthlyPayment: Math.round(total / 36) }
        ];
    }

    // Tính toán tiết kiệm hàng năm
    calculateAnnualSavings(systemPowerKW, monthlyBill, electricityPrice = 2500) {
        const monthlyProduction = systemPowerKW * 120; // kWh/tháng
        const monthlySavings = monthlyProduction * electricityPrice; // VND
        const annualSavings = monthlySavings * 12;
        
        return {
            monthlyProduction,
            monthlySavings,
            annualSavings,
            paybackPeriod: Math.ceil((monthlyBill * 12) / annualSavings) // năm
        };
    }
}

module.exports = SolarCalculator;
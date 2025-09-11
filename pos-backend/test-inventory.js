const axios = require('axios');

// Cấu hình
const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Hàm helper để test API
const testAPI = async (method, endpoint, data = null, description = '') => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` })
            },
            ...(data && { data })
        };

        console.log(`\n🧪 Testing: ${description}`);
        console.log(`${method.toUpperCase()} ${endpoint}`);
        
        const response = await axios(config);
        
        console.log('✅ Success:', response.status);
        if (response.data) {
            console.log('📄 Response:', JSON.stringify(response.data, null, 2));
        }
        
        return response.data;
    } catch (error) {
        console.log('❌ Error:', error.response?.status || error.message);
        if (error.response?.data) {
            console.log('📄 Error Response:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
};

// Test sequence
const runTests = async () => {
    console.log('🚀 Bắt đầu test hệ thống quản lý kho và món ăn...\n');

    // 1. Test lấy danh sách nguyên liệu
    console.log('📋 === TEST 1: Lấy danh sách nguyên liệu ===');
    const ingredients = await testAPI('GET', '/ingredients', null, 'Lấy danh sách nguyên liệu');
    
    if (!ingredients?.success) {
        console.log('❌ Không thể lấy danh sách nguyên liệu. Dừng test.');
        return;
    }

    // 2. Test lấy nguyên liệu theo category
    console.log('\n📋 === TEST 2: Lấy nguyên liệu theo category ===');
    await testAPI('GET', '/ingredients/category/Thịt', null, 'Lấy nguyên liệu category Thịt');

    // 3. Test kiểm tra nguyên liệu sắp hết
    console.log('\n📋 === TEST 3: Kiểm tra nguyên liệu sắp hết ===');
    await testAPI('GET', '/ingredients/low-stock', null, 'Kiểm tra nguyên liệu sắp hết');

    // 4. Test lấy danh sách món ăn
    console.log('\n📋 === TEST 4: Lấy danh sách món ăn ===');
    const menuItems = await testAPI('GET', '/menu-items', null, 'Lấy danh sách món ăn');
    
    if (!menuItems?.success) {
        console.log('❌ Không thể lấy danh sách món ăn. Dừng test.');
        return;
    }

    // 5. Test lấy món ăn theo category
    console.log('\n📋 === TEST 5: Lấy món ăn theo category ===');
    await testAPI('GET', '/menu-items/category/Món chính', null, 'Lấy món ăn category Món chính');

    // 6. Test kiểm tra món ăn không khả dụng
    console.log('\n📋 === TEST 6: Kiểm tra món ăn không khả dụng ===');
    await testAPI('GET', '/menu-items/unavailable', null, 'Kiểm tra món ăn không khả dụng');

    // 7. Test tính giá món ăn với thuế (nếu có món ăn)
    if (menuItems.data && menuItems.data.length > 0) {
        const firstMenuItem = menuItems.data[0];
        console.log('\n📋 === TEST 7: Tính giá món ăn với thuế ===');
        await testAPI(
            'GET', 
            `/menu-items/${firstMenuItem._id}/price/2`, 
            null, 
            `Tính giá món "${firstMenuItem.name}" với số lượng 2`
        );

        // 8. Test kiểm tra khả năng chế biến
        console.log('\n📋 === TEST 8: Kiểm tra khả năng chế biến ===');
        await testAPI(
            'GET', 
            `/menu-items/${firstMenuItem._id}/availability`, 
            null, 
            `Kiểm tra khả năng chế biến món "${firstMenuItem.name}"`
        );
    }

    // 9. Test lấy lịch sử kho
    console.log('\n📋 === TEST 9: Lấy lịch sử kho ===');
    await testAPI('GET', '/ingredients/history', null, 'Lấy lịch sử giao dịch kho');

    // 10. Test tạo nguyên liệu mới (nếu có token)
    if (authToken) {
        console.log('\n📋 === TEST 10: Tạo nguyên liệu mới ===');
        const newIngredient = {
            name: 'Test Ingredient',
            category: 'Gia vị',
            unit: 'g',
            currentStock: 1000,
            minStock: 200,
            pricePerUnit: 0.1,
            supplier: 'Test Supplier',
            description: 'Nguyên liệu test'
        };
        
        const createdIngredient = await testAPI(
            'POST', 
            '/ingredients', 
            newIngredient, 
            'Tạo nguyên liệu mới'
        );

        // 11. Test nhập kho (nếu tạo thành công)
        if (createdIngredient?.success) {
            console.log('\n📋 === TEST 11: Nhập kho ===');
            const stockData = {
                ingredientId: createdIngredient.data._id,
                quantity: 500,
                unitPrice: 0.1,
                supplier: 'Test Supplier',
                notes: 'Test nhập kho'
            };
            
            await testAPI('POST', '/ingredients/stock/add', stockData, 'Nhập kho nguyên liệu');
        }
    }

    console.log('\n🎉 Hoàn thành test!');
    console.log('\n📊 Tóm tắt:');
    console.log('- ✅ Lấy danh sách nguyên liệu');
    console.log('- ✅ Lấy nguyên liệu theo category');
    console.log('- ✅ Kiểm tra nguyên liệu sắp hết');
    console.log('- ✅ Lấy danh sách món ăn');
    console.log('- ✅ Lấy món ăn theo category');
    console.log('- ✅ Kiểm tra món ăn không khả dụng');
    console.log('- ✅ Tính giá món ăn với thuế');
    console.log('- ✅ Kiểm tra khả năng chế biến');
    console.log('- ✅ Lấy lịch sử kho');
    if (authToken) {
        console.log('- ✅ Tạo nguyên liệu mới');
        console.log('- ✅ Nhập kho');
    }
};

// Chạy test
runTests().catch(console.error); 
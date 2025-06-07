const productData = [
    {
        id: 'hobby-1-1',
        category: 'Photography',
        name: 'Canon EOS 80D',
        description: 'DSLR camera for enthusiasts',
        price: 12000000,
        imageUrl: './logo-pinjemin.png',
        type: 'buy', // 'buy' or 'rent'
    },
    {
        id: 'hobby-1-2',
        category: 'Photography',
        name: 'Sony Alpha a6000',
        description: 'Mirrorless camera with fast autofocus',
        price: 9000000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'rent',
        rentDuration: '24 hours', // '12 hours' or '24 hours' (only if type is 'rent')
    },
    {
        id: 'hobby-2-1',
        category: 'Gaming',
        name: 'PlayStation 5',
        description: 'Next-gen gaming console',
        price: 8000000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'rent',
        rentDuration: '24 hours',
    },
    {
        id: 'hobby-2-2',
        category: 'Gaming',
        name: 'Gaming PC',
        description: 'Custom-built high-end gaming PC',
        price: 25000000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'buy',
    },
    {
        id: 'hobby-3-1',
        category: 'Reading',
        name: 'Kindle Paperwhite',
        description: 'E-reader with adjustable warm light',
        price: 2000000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'buy',
    },
    {
        id: 'hobby-3-2',
        category: 'Reading',
        name: 'Noise Cancelling Headphones',
        description: 'Headphones for distraction-free reading',
        price: 3500000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'buy',
    },
    {
        id: 'hobby-4-1',
        category: 'Cooking',
        name: 'KitchenAid Stand Mixer',
        description: 'Versatile stand mixer for baking',
        price: 7000000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'buy',
    },
    {
        id: 'hobby-4-2',
        category: 'Cooking',
        name: 'Sous Vide Immersion Circulator',
        description: 'Precision cooking device',
        price: 3000000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'rent',
        rentDuration: '24 hours',
    },
    {
        id: 'hobby-5-1',
        category: 'Gardening',
        name: 'Gardening Tool Set',
        description: 'Complete gardening tool set',
        price: 1000000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'rent',
        rentDuration: '12 hours',
    },
    {
        id: 'hobby-5-2',
        category: 'Gardening',
        name: 'Raised Garden Bed',
        description: 'Elevated garden bed',
        price: 2000000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'buy',
    },
    {
        id: 'hobby-6-1',
        category: 'Music',
        name: 'Acoustic Guitar',
        description: 'Beginner-friendly acoustic guitar',
        price: 1500000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'rent',
        rentDuration: '24 hours',
    },
    {
        id: 'hobby-6-2',
        category: 'Music',
        name: 'Headphones',
        description: 'Studio-quality headphones',
        price: 2500000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'buy',
    },
    {
        id: 'hobby-7-1',
        category: 'Sports',
        name: 'Basketball',
        description: 'Official size basketball',
        price: 300000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'buy',
    },
    {
        id: 'hobby-7-2',
        category: 'Sports',
        name: 'Tennis Racket',
        description: 'Lightweight tennis racket',
        price: 1200000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'rent',
        rentDuration: '12 hours',
    },
    {
        id: 'hobby-8-1',
        category: 'Drawing',
        name: 'Drawing Pencils',
        description: 'Set of drawing pencils',
        price: 200000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'buy',
    },
    {
        id: 'hobby-8-2',
        category: 'Drawing',
        name: 'Easel',
        description: 'Adjustable easel',
        price: 1000000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'buy',
    },
    {
        id: 'hobby-9-1',
        category: 'Traveling',
        name: 'Backpack',
        description: 'Travel backpack',
        price: 1000000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'buy',
    },
    {
        id: 'hobby-9-2',
        category: 'Traveling',
        name: 'Camera',
        description: 'Compact camera',
        price: 3000000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'rent',
        rentDuration: '24 hours',
    },
    {
        id: 'hobby-10-1',
        category: 'Writing',
        name: 'Laptop',
        description: 'Lightweight laptop',
        price: 8000000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'buy',
    },
    {
        id: 'hobby-10-2',
        category: 'Writing',
        name: 'Keyboard',
        description: 'Mechanical keyboard',
        price: 1500000,
        imageUrl: 'https://via.placeholder.com/150',
        type: 'buy',
    },
];

console.log(productData);

class Products {
    static getAll() {
        return productData;
    }

    static getByCategory(category) {
        const loweredCaseCategory = category.toLowerCase();
        return productData.filter((product) => {
            const loweredCaseProductCategory = (product.category || '').toLowerCase();
            return loweredCaseProductCategory.includes(loweredCaseCategory);
        });
    }

    static getByType(type) {
        const loweredCaseType = type.toLowerCase();
        return productData.filter((product) => {
            const loweredCaseProductType = (product.type || '').toLowerCase();
            return loweredCaseProductType.includes(loweredCaseType);
        });
    }

    static searchProduct(query) {
        const loweredCaseQuery = query.toLowerCase();
        return productData.filter((product) => {
            const loweredCaseProductName = (product.name || '').toLowerCase();
            return loweredCaseProductName.includes(loweredCaseQuery);
        });
    }

    static addProduct(product) {
        productData.push(product);
    }
}

export default Products;

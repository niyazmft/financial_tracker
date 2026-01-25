import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useFinanceStore } from '@/stores/finance';
import { useApi } from '@/services/apiInstance';

// Mock the API instance
vi.mock('@/services/apiInstance', () => ({
    useApi: vi.fn()
}));

describe('Finance Store - Categories', () => {
    let store;
    const mockApi = {
        fetchCategories: vi.fn(),
        fetchCategoryTypes: vi.fn(),
        createCategory: vi.fn(),
        updateCategory: vi.fn(),
        deleteCategory: vi.fn()
    };

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useFinanceStore();
        useApi.mockReturnValue(mockApi);
        vi.clearAllMocks();
    });

    it('should fetch categories and types', async () => {
        mockApi.fetchCategories.mockResolvedValue({ 
            success: true, 
            categories: [{ Id: 1, category_name: 'Test' }] 
        });
        mockApi.fetchCategoryTypes.mockResolvedValue({ 
            success: true, 
            types: ['spending', 'earning'] 
        });

        await store.fetchCategories();

        expect(store.categories).toHaveLength(1);
        expect(store.categories[0].category_name).toBe('Test');
        expect(store.categoryTypes).toContain('spending');
    });

    it('should add a new category', async () => {
        const newCat = { Id: 2, category_name: 'New', type: 'spending' };
        mockApi.createCategory.mockResolvedValue({ success: true, category: newCat });

        await store.createCategory('New', 'spending');

        expect(store.categories).toContainEqual(newCat);
    });

    it('should update an existing category', async () => {
        store.categories = [{ Id: 1, category_name: 'Old', type: 'spending' }];
        const updatedCat = { Id: 1, category_name: 'Updated', type: 'spending' };
        mockApi.updateCategory.mockResolvedValue({ success: true, category: updatedCat });

        await store.updateCategory(1, { category_name: 'Updated' });

        expect(store.categories[0].category_name).toBe('Updated');
    });

    it('should delete a category', async () => {
        store.categories = [
            { Id: 1, category_name: 'ToDelete' },
            { Id: 2, category_name: 'Keep' }
        ];
        mockApi.deleteCategory.mockResolvedValue({ success: true });

        await store.deleteCategory(1, 2); // Delete 1, merge into 2

        expect(store.categories).toHaveLength(1);
        expect(store.categories[0].category_name).toBe('Keep');
    });
});

import { ref, computed, onMounted, onUnmounted } from 'vue';

export function useBreakpoints() {
    const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);

    const updateWidth = () => {
        if (typeof window !== 'undefined') {
            windowWidth.value = window.innerWidth;
        }
    };

    onMounted(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', updateWidth);
        }
    });

    onUnmounted(() => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', updateWidth);
        }
    });

    const isMobile = computed(() => windowWidth.value < 768);
    const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 1200);
    const isDesktop = computed(() => windowWidth.value >= 1200);

    return {
        windowWidth,
        isMobile,
        isTablet,
        isDesktop
    };
}

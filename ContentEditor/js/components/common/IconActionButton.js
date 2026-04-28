window.ContentEditorComponents = window.ContentEditorComponents || {};

window.ContentEditorComponents.IconActionButton = {
    props: {
        title: { type: String, default: '' },
        icon: { type: String, default: 'edit' },
        variant: { type: String, default: 'neutral' },
        disabled: { type: Boolean, default: false }
    },
    emits: ['click'],
    computed: {
        variantClass() {
            if (this.variant === 'danger') return 'action-icon-btn-danger';
            if (this.variant === 'primary') return 'action-icon-btn-primary';
            if (this.variant === 'success') return 'action-icon-btn-success';
            if (this.variant === 'warning') return 'action-icon-btn-warning';
            return 'action-icon-btn-neutral';
        },
        iconPath() {
            if (this.icon === 'trash') return 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3';
            if (this.icon === 'clear') return 'M16 22l-1-4 M19 14a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2h-3a1 1 0 0 1-1-1V4a2 2 0 0 0-4 0v5a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1 M19 14H5l-1.973 6.767A1 1 0 0 0 4 22h16a1 1 0 0 0 .973-1.233z M8 22l1-4';
            if (this.icon === 'eye') return 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0 M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0';
            if (this.icon === 'eye-off') return 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49 M14.084 14.158a3 3 0 0 1-4.242-4.242 M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143 M2 2l20 20';
            if (this.icon === 'up') return 'M12 19V5M6 11l6-6 6 6';
            if (this.icon === 'down') return 'M12 5v14M6 13l6 6 6-6';
            if (this.icon === 'plus') return 'M12 5v14M5 12h14';
            return 'M4 20h4l10-10a2 2 0 0 0-4-4L4 16v4zM13 7l4 4';
        }
    },
    template: `
        <button
            :title="title"
            :disabled="disabled"
            class="action-icon-btn"
            :class="variantClass"
            @click="$emit('click')"
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path :d="iconPath"></path>
            </svg>
        </button>
    `
};

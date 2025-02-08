// Handle Add Wellness Tip form submission
document.getElementById('add-wellness-tip-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        images: Array.from(formData.getAll('images')),
        name_en: formData.get('name_en'),
        name_ru: formData.get('name_ru'),
        description_en: formData.get('description_en'),
        description_ru: formData.get('description_ru'),
    };

    try {
        const response = await fetch('/api/wellness-tips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (response.ok) {
            showNotification('Wellness tip added successfully!', 'success');
            window.location.reload();
        } else {
            showNotification(result.message || 'Failed to add wellness tip.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Server error. Please try again.', 'error');
    }
});

// Handle Edit Wellness Tip form submission
document.querySelectorAll('.edit-wellness-tip-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            images: Array.from(formData.getAll('images')),
            name_en: formData.get('name_en'),
            name_ru: formData.get('name_ru'),
            description_en: formData.get('description_en'),
            description_ru: formData.get('description_ru'),
        };

        try {
            const response = await fetch(`/api/wellness-tips/${form.action.split('/').pop()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (response.ok) {
                showNotification('Wellness tip updated successfully!', 'success');
                window.location.reload();
            } else {
                showNotification(result.message || 'Failed to update wellness tip.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Server error. Please try again.', 'error');
        }
    });
});

// Handle Delete Wellness Tip form submission
document.querySelectorAll('.delete-wellness-tip-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`/api/wellness-tips/${form.action.split('/').pop()}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (response.ok) {
                showNotification('Wellness tip deleted successfully!', 'success');
                window.location.reload();
            } else {
                showNotification(result.message || 'Failed to delete wellness tip.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Server error. Please try again.', 'error');
        }
    });
});
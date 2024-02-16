function toggleContent(btn) {
    
    // Find the parent cell of the button
    const parentCell = btn.closest('td');

    // Find the expandable content div
    const expandableContent = parentCell.querySelector('.expandable-content');

    // Toggle the display of the expandable content
    if (expandableContent.style.display === 'block') {
        expandableContent.style.display = 'none';
        btn.textContent = '▶';
    } else {
        expandableContent.style.display = 'block';
        btn.textContent = '▼';
    }
}






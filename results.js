// Load analysis data from localStorage
window.addEventListener('DOMContentLoaded', () => {
    const analysisData = localStorage.getItem('cvAnalysis');

    if (!analysisData) {
        alert('No analysis data found. Please upload a CV first.');
        window.location.href = 'index.html';
        return;
    }

    const data = JSON.parse(analysisData);
    displayAnalysis(data);
});

function displayAnalysis(data) {
    // Personal Information
    const personalInfo = document.getElementById('personalInfo');
    personalInfo.innerHTML = formatText(data.personalInfo || 'Not available');

    // Summary
    const summary = document.getElementById('summary');
    summary.innerHTML = formatText(data.summary || 'Not available');

    // Skills
    const skills = document.getElementById('skills');
    if (data.skills && data.skills.length > 0) {
        skills.innerHTML = data.skills.map(skill =>
            `<div class="skill-tag">${skill}</div>`
        ).join('');
    } else {
        skills.innerHTML = '<p>No specific skills extracted</p>';
    }

    // Experience
    const experience = document.getElementById('experience');
    experience.innerHTML = formatText(data.experience || 'Not available');

    // Education
    const education = document.getElementById('education');
    education.innerHTML = formatText(data.education || 'Not available');

    // Strengths
    const strengths = document.getElementById('strengths');
    strengths.innerHTML = formatText(data.strengths || 'Not available');

    // Recommendations
    const recommendations = document.getElementById('recommendations');
    recommendations.innerHTML = formatText(data.recommendations || 'Not available');

    // Full Analysis
    const fullAnalysis = document.getElementById('fullAnalysis');
    if (data.fullText) {
        fullAnalysis.innerHTML = formatText(data.fullText);
    } else {
        fullAnalysis.parentElement.style.display = 'none';
    }
}

function formatText(text) {
    if (!text) return '';

    // Handle array
    if (Array.isArray(text)) {
        return text.map(item => formatText(item)).join('<br>');
    }

    // Handle object
    if (typeof text === 'object') {
        return Object.entries(text)
            .map(([key, value]) => `<strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${formatText(value)}`)
            .join('<br>');
    }

    // Ensure text is a string
    let formatted = String(text);

    // Convert markdown-style formatting to HTML
    formatted = formatted
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Wrap in paragraph if not already
    if (!formatted.startsWith('<p>')) {
        formatted = '<p>' + formatted + '</p>';
    }

    return formatted;
}

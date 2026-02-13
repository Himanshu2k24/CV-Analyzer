const uploadArea = document.getElementById('uploadArea');
const cvFileInput = document.getElementById('cvFile');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingMsg = document.getElementById('loadingMsg');

// Hard-coded API key
const GEMINI_API_KEY = 'AIzaSyAIKsjg2d00r1WV9DaoifKcDYvmBhYe2-0';

let selectedFile = null;

// Drag and drop functionality
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#764ba2';
    uploadArea.style.background = 'rgba(102, 126, 234, 0.1)';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.background = 'transparent';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.background = 'transparent';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

// File input change
cvFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});



function handleFileSelect(file) {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, or DOCX file');
        return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    fileInfo.classList.remove('hidden');
    checkFormValidity();
}

function checkFormValidity() {
    if (selectedFile) {
        analyzeBtn.disabled = false;
    } else {
        analyzeBtn.disabled = true;
    }
}

// Analyze button click
analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        alert('Please select a file');
        return;
    }

    analyzeBtn.style.display = 'none';
    loadingMsg.classList.remove('hidden');

    try {
        const cvText = await extractTextFromFile(selectedFile);
        const analysis = await analyzeCV(cvText, GEMINI_API_KEY);

        // Store analysis in localStorage
        localStorage.setItem('cvAnalysis', JSON.stringify(analysis));
        localStorage.setItem('cvFileName', selectedFile.name);

        // Redirect to results page
        window.location.href = 'analysis.html';
    } catch (error) {
        console.error('Error:', error);
        alert('Error analyzing CV: ' + error.message);
        analyzeBtn.style.display = 'block';
        loadingMsg.classList.add('hidden');
    }
});

async function extractTextFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            const content = e.target.result;

            if (file.type === 'application/pdf') {
                // For PDF, we'll send as base64 and let Gemini handle it
                const base64 = content.split(',')[1];
                resolve({ type: 'pdf', content: base64 });
            } else {
                // For DOC/DOCX, read as text (simplified - in production use proper library)
                resolve({ type: 'text', content: content });
            }
        };

        reader.onerror = reject;

        if (file.type === 'application/pdf') {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    });
}

async function analyzeCV(fileData, apiKey) {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    let prompt = `Analyze this CV/Resume and provide a detailed analysis in the following JSON format:
{
    "personalInfo": "Extract name, email, phone, location, LinkedIn if available",
    "summary": "Professional summary or objective",
    "skills": ["skill1", "skill2", "skill3"...] (extract all technical and soft skills),
    "experience": "Detailed work experience with companies, roles, and achievements",
    "education": "Educational background with degrees and institutions",
    "strengths": "Key strengths and unique selling points",
    "recommendations": "Suggestions for improvement and career advice"
}

Make it detailed and professional.`;

    let requestBody;

    if (fileData.type === 'pdf') {
        requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: "application/pdf",
                            data: fileData.content
                        }
                    }
                ]
            }]
        };
    } else {
        requestBody = {
            contents: [{
                parts: [{
                    text: prompt + "\n\nCV Content:\n" + fileData.content
                }]
            }]
        };
    }

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to analyze CV');
    }

    const data = await response.json();
    const analysisText = data.candidates[0].content.parts[0].text;

    // Try to extract JSON from the response
    let analysisData;
    try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            analysisData = JSON.parse(jsonMatch[0]);
        } else {
            // If no JSON found, create structured data from text
            analysisData = {
                personalInfo: "Information extracted from CV",
                summary: analysisText.substring(0, 500),
                skills: [],
                experience: "See full analysis below",
                education: "See full analysis below",
                strengths: "See full analysis below",
                recommendations: "See full analysis below",
                fullText: analysisText
            };
        }
    } catch (e) {
        analysisData = {
            personalInfo: "Information extracted from CV",
            summary: analysisText,
            skills: [],
            experience: "",
            education: "",
            strengths: "",
            recommendations: "",
            fullText: analysisText
        };
    }

    return analysisData;
}

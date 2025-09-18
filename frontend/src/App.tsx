import React, { useState, useEffect } from 'react'
import { generateTests } from './api'
import { GenerateRequest, GenerateResponse, TestCase } from './types'
// Mockaroo reference: https://mockaroo.com/

function App() {
  // --- Test Data Generation State ---
  const [activeTab, setActiveTab] = useState<'tests' | 'data'>('tests')
  const FIELD_TYPES = [
    'First Name', 'Last Name', 'Full Name', 'Email Address', 'Phone', 'City', 'Country', 'Company', 'Date', 'Number', 'Boolean', 'Text', 'Custom List'
  ];
  const [dataFields, setDataFields] = useState<Array<{ name: string; type: string }>>([
    { name: 'username', type: 'First Name' },
    { name: 'email', type: 'Email Address' }
  ])
  const [rowCount, setRowCount] = useState(5)
  const [generatedData, setGeneratedData] = useState<Array<Record<string, string>>>([])
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  // Add/remove fields for test data schema
  const handleFieldChange = (idx: number, field: Partial<{ name: string; type: string }>) => {
    setDataFields(fields => fields.map((f, i) => i === idx ? { ...f, ...field } : f))
  }
  const addField = () => setDataFields(fields => [...fields, { name: '', type: '' }])
  const removeField = (idx: number) => setDataFields(fields => fields.filter((_, i) => i !== idx))

  // Generate test data (Mockaroo reference)
  async function handleGenerateData() {
    setIsDataLoading(true)
    setDataError(null)
    // Validate fields and types
    if (!dataFields.length || dataFields.some(f => !f.name.trim() || !f.type.trim())) {
      setDataError('Please provide a field name and select a type for each field.')
      setIsDataLoading(false)
      return
    }
    // Validate API key
    const apiKey = '01cd5110' // <-- Replace with your actual Mockaroo API key
    if (!apiKey) {
      setDataError('Please set your Mockaroo API key in the code.')
      setIsDataLoading(false)
      return
    }
    try {
      const schema = dataFields.map(f => ({ name: f.name, type: f.type }))
      const response = await fetch(`https://api.mockaroo.com/api/generate.json?key=${apiKey}&count=${rowCount}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schema)
      })
      if (!response.ok) throw new Error('Failed to generate test data')
      const data = await response.json()
      setGeneratedData(data)
    } catch (err) {
      setDataError('Error generating test data. Please check your Mockaroo API key and schema.')
    } finally {
      setIsDataLoading(false)
    }
  }
  // ...existing code...

// Remove duplicate and orphaned code below this line
  // Category selection UI state
  const CATEGORY_OPTIONS = [
    { label: 'Positive', value: 'Positive' },
    { label: 'Negative', value: 'Negative' },
    { label: 'Edge', value: 'Edge' },
    { label: 'Authorization', value: 'Authorization' },
    { label: 'Non-Functional', value: 'Non-Functional' }
  ];
  const [formData, setFormData] = useState<GenerateRequest>({
    storyTitle: '',
    acceptanceCriteria: '',
    description: '',
    additionalInfo: '',
    category: ''
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    formData.category ? formData.category.split(',').map(s => s.trim()).filter(Boolean) : []
  );
  // Sync formData.category with selectedCategories
  const handleCategoryChange = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    );
  };
  // Keep formData.category in sync
  useEffect(() => {
    setFormData(prev => ({ ...prev, category: selectedCategories.join(',') }));
  }, [selectedCategories]);
  // Jira integration state
  const [jiraStoryId, setJiraStoryId] = useState('')
  const [isJiraLoading, setIsJiraLoading] = useState(false)
  const [jiraError, setJiraError] = useState<string | null>(null)

  // Real Jira fetch function using backend API
  async function handleFetchJiraInfo(storyId: string) {
    setIsJiraLoading(true)
    setJiraError(null)
    try {
      const jiraData = await import('./api').then(mod => mod.fetchJiraInfo(storyId))
      setFormData(prev => ({
        ...prev,
        storyTitle: jiraData.storyTitle,
        description: jiraData.description,
        acceptanceCriteria: jiraData.acceptanceCriteria
      }))
    } catch (err) {
      setJiraError('Failed to fetch Jira info')
    } finally {
      setIsJiraLoading(false)
    }
  }
  // ...existing code...
  const [results, setResults] = useState<GenerateResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedTestCases, setExpandedTestCases] = useState<Set<string>>(new Set())

  const toggleTestCaseExpansion = (testCaseId: string) => {
    const newExpanded = new Set(expandedTestCases)
    if (newExpanded.has(testCaseId)) {
      newExpanded.delete(testCaseId)
    } else {
      newExpanded.add(testCaseId)
    }
    setExpandedTestCases(newExpanded)
  }

  const handleInputChange = (field: keyof GenerateRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.storyTitle.trim() || !formData.acceptanceCriteria.trim()) {
      setError('Story Title and Acceptance Criteria are required')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await generateTests(formData)
      setResults(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tests')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0 40px 0' }}>
      <div style={{ display: 'flex', background: '#f3f6fb', borderRadius: 12, boxShadow: '0 2px 8px #e1e8ed', overflow: 'hidden' }}>
        <button
        className={activeTab === 'tests' ? 'submit-btn' : 'category-chip'}
        style={{ borderRadius: 0, fontSize: 18, padding: '16px 32px', borderRight: '1px solid #e1e8ed', background: activeTab === 'tests' ? '#2563eb' : 'transparent', color: activeTab === 'tests' ? 'white' : '#222', fontWeight: 600 }}
        onClick={() => setActiveTab('tests')}
        >Generate Test Cases</button>
        <button
        className={activeTab === 'data' ? 'submit-btn' : 'category-chip'}
        style={{ borderRadius: 0, fontSize: 18, padding: '16px 32px', background: activeTab === 'data' ? '#2563eb' : 'transparent', color: activeTab === 'data' ? 'white' : '#222', fontWeight: 600 }}
        onClick={() => setActiveTab('data')}
        >Generate Test Data</button>
      </div>
      </div>
      {/* Tab content rendering below the tab menu */}
      {activeTab === 'tests' && (
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group" style={{ marginBottom: 24 }}>
          <label htmlFor="jiraStoryId" className="form-label">Jira Story ID</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              id="jiraStoryId"
              className="form-input"
              value={jiraStoryId}
              onChange={e => setJiraStoryId(e.target.value)}
              placeholder="Enter Jira story ID..."
              style={{ maxWidth: 240 }}
            />
            <button
              type="button"
              className="submit-btn"
              disabled={isJiraLoading || !jiraStoryId.trim()}
              onClick={() => handleFetchJiraInfo(jiraStoryId)}
            >
              {isJiraLoading ? 'Fetching...' : 'Fetch'}
            </button>
          </div>
          {jiraError && <div className="error-banner" style={{ marginTop: 8 }}>{jiraError}</div>}
        </div>
        <div className="form-group">
        <label htmlFor="storyTitle" className="form-label">
          Story Title *
        </label>
        <input
          type="text"
          id="storyTitle"
          className="form-input"
          value={formData.storyTitle}
          onChange={(e) => handleInputChange('storyTitle', e.target.value)}
          placeholder="Enter the user story title..."
          required
        />
        </div>
        <div className="form-group">
        <label htmlFor="description" className="form-label">
          Description
        </label>
        <textarea
          id="description"
          className="form-textarea"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Additional description (optional)..."
        />
        </div>
        <div className="form-group">
        <label htmlFor="acceptanceCriteria" className="form-label">
          Acceptance Criteria *
        </label>
        <textarea
          id="acceptanceCriteria"
          className="form-textarea"
          value={formData.acceptanceCriteria}
          onChange={(e) => handleInputChange('acceptanceCriteria', e.target.value)}
          placeholder="Enter the acceptance criteria..."
          required
        />
        </div>
        <div className="form-group">
        <label htmlFor="additionalInfo" className="form-label">
          Additional Info
        </label>
        <textarea
          id="additionalInfo"
          className="form-textarea"
          value={formData.additionalInfo}
          onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
          placeholder="Any additional information (optional)..."
        />
        </div>
        <div className="form-group">
        <label className="form-label" style={{ marginBottom: 8 }}>Test Categories</label>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {CATEGORY_OPTIONS.map(opt => (
          <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: '4px 12px', borderRadius: '6px', background: selectedCategories.includes(opt.value) ? '#e0f7fa' : '#f5f5f5', boxShadow: selectedCategories.includes(opt.value) ? '0 0 4px #00bcd4' : 'none', cursor: 'pointer', border: selectedCategories.includes(opt.value) ? '2px solid #00bcd4' : '2px solid #e1e8ed' }}>
            <input
            type="checkbox"
            checked={selectedCategories.includes(opt.value)}
            onChange={() => handleCategoryChange(opt.value)}
            style={{ accentColor: '#00bcd4', width: 18, height: 18 }}
            />
            {opt.label}
          </label>
          ))}
        </div>
        <div style={{ marginTop: 8, color: '#6b7280', fontSize: 13 }}>
          Select one or more categories. If none selected, all categories will be generated.
        </div>
        </div>
        <div className="form-group">
        <label htmlFor="testcaseCount" className="form-label">
          Number of Test Cases
        </label>
        <input
          type="number"
          id="testcaseCount"
          className="form-input"
          min={1}
          max={100}
          value={formData.testcaseCount || 5}
          onChange={e => handleInputChange('testcaseCount', e.target.value)}
          placeholder="Enter number of test cases"
          style={{ maxWidth: 120 }}
        />
        </div>
      <button type="submit" className="submit-btn" style={{ marginTop: 18, fontSize: 17, padding: '12px 32px', width: '100%' }}>
        {isLoading ? 'Generating...' : 'Generate Test Cases'}
      </button>
      {error && <div className="error-banner" style={{ marginTop: 16 }}>{error}</div>}
      {results && results.cases && results.cases.length > 0 && (
        <div className="results-container" style={{ marginTop: 32, borderRadius: 12, boxShadow: '0 2px 8px #e1e8ed' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 className="results-title" style={{ margin: 0 }}>Generated Test Cases</h3>
            <button
              type="button"
              className="submit-btn"
              style={{ padding: '8px 18px', fontSize: 15, borderRadius: 6, background: '#27ae60', marginLeft: 16 }}
              onClick={() => {
                const headers = ['ID', 'Title', 'Steps', 'Expected Result', 'Category'];
                const rows = results.cases.map((tc, idx) => [
                  tc.id || idx + 1,
                  '"' + (tc.title || '').replace(/"/g, '""') + '"',
                  '"' + (tc.steps && tc.steps.length > 0 ? tc.steps.join(' | ') : '-') + '"',
                  '"' + (tc.expectedResult || '').replace(/"/g, '""') + '"',
                  '"' + (tc.category || '') + '"'
                ]);
                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'testcases.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              }}
            >Export to Excel</button>
          </div>
          <table className="results-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Steps</th>
                <th>Expected Result</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {results.cases.map((tc, idx) => (
                <tr key={tc.id || idx}>
                  <td>{tc.id || idx + 1}</td>
                  <td>{tc.title}</td>
                  <td>{tc.steps && tc.steps.length > 0 ? tc.steps.join(' | ') : '-'}</td>
                  <td>{tc.expectedResult}</td>
                  <td>{tc.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </form>
      )}
      {activeTab === 'data' && (
      <div className="form-container" style={{ maxWidth: 600, margin: '0 auto', boxShadow: '0 2px 12px #e1e8ed', borderRadius: 12 }}>
        <h2 style={{ marginBottom: 16, textAlign: 'center', color: '#2563eb' }}>Generate Test Data <a href="https://mockaroo.com/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, marginLeft: 8, color: '#888' }}>(Reference: Mockaroo)</a></h2>
        <div className="form-group">
        <label className="form-label">Fields</label>
        {dataFields.map((field, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Field Name"
            value={field.name}
            onChange={e => handleFieldChange(idx, { name: e.target.value })}
            style={{ width: 160, fontSize: 16, padding: '8px 12px', borderRadius: 6, border: '2px solid #e1e8ed' }}
          />
          <select
            value={field.type}
            onChange={e => handleFieldChange(idx, { type: e.target.value })}
            style={{ width: 180, fontSize: 16, padding: '8px 12px', borderRadius: 6, border: '2px solid #e1e8ed' }}
          >
            <option value="">Select Type</option>
            {FIELD_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button type="button" className="category-chip" onClick={() => removeField(idx)} style={{ color: '#e74c3c', fontWeight: 600, fontSize: 15 }}>Remove</button>
          </div>
        ))}
        <button type="button" className="category-chip" onClick={addField} style={{ marginTop: 8, fontWeight: 600, fontSize: 15 }}>Add Field</button>
        </div>
        <div className="form-group" style={{ marginTop: 18 }}>
        <label className="form-label">Number of Rows</label>
        <input
          type="number"
          min={1}
          max={100}
          value={rowCount}
          onChange={e => setRowCount(Number(e.target.value))}
          style={{ width: 100, fontSize: 16, padding: '8px 12px', borderRadius: 6, border: '2px solid #e1e8ed' }}
        />
        </div>
        <button type="button" className="submit-btn" onClick={handleGenerateData} disabled={isDataLoading} style={{ marginTop: 24, fontSize: 17, padding: '12px 32px' }}>
        {isDataLoading ? 'Generating...' : 'Generate Data'}
        </button>
        {dataError && <div className="error-banner" style={{ marginTop: 16 }}>{dataError}</div>}
        {generatedData.length > 0 && (
        <div className="results-container" style={{ marginTop: 32, borderRadius: 12, boxShadow: '0 2px 8px #e1e8ed' }}>
          <h3 style={{ textAlign: 'center', color: '#2563eb' }}>Generated Test Data</h3>
          <table className="results-table">
          <thead>
            <tr>
            {Object.keys(generatedData[0]).map(col => (
              <th key={col}>{col}</th>
            ))}
            </tr>
          </thead>
          <tbody>
            {generatedData.map((row, i) => (
            <tr key={i}>
              {Object.values(row).map((val, j) => (
              <td key={j}>{val}</td>
              ))}
            </tr>
            ))}
          </tbody>
          </table>
        </div>
        )}
      </div>
      )}
          <style>{`
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
            background: linear-gradient(120deg, #e0eafc 0%, #cfdef3 100%);
            color: #222;
            line-height: 1.6;
          }
          .container {
            max-width: 700px;
            margin: 40px auto;
            padding: 32px 24px;
            background: #fff;
            border-radius: 18px;
            box-shadow: 0 6px 32px rgba(44, 62, 80, 0.10);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .title {
            font-size: 2.7rem;
            color: #2563eb;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: 1px;
          }
          .subtitle {
            color: #555;
            font-size: 1.15rem;
            margin-bottom: 8px;
          }
          .form-container {
            background: #f7fafd;
            border-radius: 12px;
            padding: 28px 22px;
            box-shadow: 0 2px 10px rgba(44,62,80,0.07);
            margin-bottom: 30px;
          }
          .form-group {
            margin-bottom: 22px;
          }
          .form-label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: #2563eb;
            font-size: 1.08rem;
          }
          .form-input, .form-textarea, select {
            width: 100%;
            padding: 13px;
            border: 2px solid #e1e8ed;
            border-radius: 8px;
            font-size: 15px;
            background: #f9fbfc;
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          .form-input:focus, .form-textarea:focus, select:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 2px #2563eb22;
          }
          .form-textarea {
            resize: vertical;
            min-height: 90px;
          }
          .submit-btn {
            background: linear-gradient(90deg, #2563eb 0%, #1e40af 100%);
            color: white;
            border: none;
            padding: 13px 28px;
            border-radius: 8px;
            font-size: 17px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 2px 8px #2563eb22;
            transition: background 0.2s, box-shadow 0.2s;
          }
          .submit-btn:hover:not(:disabled) {
            background: linear-gradient(90deg, #1e40af 0%, #2563eb 100%);
            box-shadow: 0 4px 16px #2563eb33;
          }
          .submit-btn:disabled {
            background: #bdc3c7;
            cursor: not-allowed;
          }
          .category-chip {
            background: #e3eafc;
            color: #2563eb;
            border: 1.5px solid #cfd8fc;
            border-radius: 999px;
            padding: 7px 18px;
            font-weight: 500;
            font-size: 15px;
            margin-right: 8px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: background 0.2s, color 0.2s, box-shadow 0.2s;
          }
          .category-chip.selected, .category-chip:active {
            background: linear-gradient(90deg, #2563eb 0%, #1e40af 100%);
            color: #fff;
            border-color: #2563eb;
            box-shadow: 0 2px 8px #2563eb22;
          }
          .category-chip:hover {
            background: #dbeafe;
            color: #1e40af;
          }
          .error-banner {
            background: #e74c3c;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 1.08rem;
            text-align: center;
          }
          .results-container {
            background: #f7fafd;
            border-radius: 12px;
            padding: 28px 22px;
            box-shadow: 0 2px 10px rgba(44,62,80,0.07);
            margin-top: 30px;
          }
          .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
          }
          .results-table th, .results-table td {
            padding: 13px 10px;
            text-align: left;
            border-bottom: 1px solid #e1e8ed;
          }
          .results-table th {
            background: #e3eafc;
            font-weight: 600;
            color: #2563eb;
            font-size: 1.05rem;
          }
          .results-table tr:hover {
            background: #f3f6fb;
          }
          .results-title {
            font-size: 1.5rem;
            color: #2563eb;
            margin-bottom: 10px;
            text-align: center;
          }
          .form-group:last-child {
            margin-bottom: 0;
          }
          .form-container h2 {
            font-size: 1.4rem;
            color: #2563eb;
            margin-bottom: 18px;
          }
          .form-container label {
            font-size: 1.08rem;
          }
          .form-container input[type="number"] {
            max-width: 120px;
          }
          .form-container .category-chip {
            margin-top: 0;
          }
          .form-container .category-chip:last-child {
            margin-right: 0;
          }
          .form-container .form-group {
            margin-bottom: 18px;
          }
          .form-container .form-group:last-child {
            margin-bottom: 0;
          }

          `}</style>
        </div>
      );
    }

export default App;
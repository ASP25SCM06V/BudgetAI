import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import SplitSummary from '../components/SplitSummary.jsx'
import { splitExtract, splitCalculate, splitSave, splitPay } from '../api/index.js'

const STEPS = ['Upload', 'Review Items', 'Add People', 'Split Mode', 'Summary']

// Convert File to base64 string (without the data:... prefix)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve({ base64, mediaType: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function SplitReceipt() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)

  const [items, setItems] = useState([])
  const [receiptTotal, setReceiptTotal] = useState(null)

  const [people, setPeople] = useState(['You'])
  const [nameInput, setNameInput] = useState('')

  const [splitMode, setSplitMode] = useState('equal')

  const [splits, setSplits] = useState([])
  const [paid, setPaid] = useState([])
  const [splitId, setSplitId] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large — max 10MB')
      return
    }
    setError('')
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleExtract = async () => {
    if (!selectedFile) return
    setLoading(true)
    setError('')
    try {
      const { base64, mediaType } = await fileToBase64(selectedFile)
      const data = await splitExtract(base64, mediaType)
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Couldn't read receipt clearly — try a clearer photo")
      }
      setItems(data.items.map((i) => ({ ...i, assignedTo: null })))
      setReceiptTotal(data.total)
      setStep(1)
    } catch (e) {
      setError(e.message || "Couldn't read receipt clearly — try a clearer photo")
    } finally {
      setLoading(false)
    }
  }

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const addItem = () => {
    setItems((prev) => [...prev, { name: '', price: 0, assignedTo: null }])
  }

  const addPerson = () => {
    const name = nameInput.trim()
    if (!name || people.includes(name)) return
    setPeople((prev) => [...prev, name])
    setNameInput('')
  }

  const removePerson = (name) => {
    if (name === 'You') return
    setPeople((prev) => prev.filter((p) => p !== name))
    setItems((prev) =>
      prev.map((i) => (i.assignedTo === name ? { ...i, assignedTo: null } : i))
    )
  }

  const handleCalculate = async () => {
    if (people.length < 1) {
      setError('Add at least one person')
      return
    }
    setLoading(true)
    setError('')
    try {
      const itemsForApi = items.map(({ name, price, assignedTo }) => ({ name, price, assignedTo }))
      const result = await splitCalculate(itemsForApi, people, splitMode)
      setSplits(result)

      const total = receiptTotal || items.reduce((s, i) => s + i.price, 0)
      const id = await splitSave({ items: itemsForApi, people, mode: splitMode, splits: result, total })
      setSplitId(id)

      localStorage.setItem(
        `split_${id}`,
        JSON.stringify({ items: itemsForApi, people, mode: splitMode, splits: result, total, paid: [], id })
      )

      setStep(4)
    } catch (e) {
      const total = receiptTotal || items.reduce((s, i) => s + i.price, 0)
      const base = Math.floor((total / people.length) * 100) / 100
      const fallback = people.map((p, idx) => ({
        person: p,
        amount: idx === people.length - 1 ? Math.round((total - base * (people.length - 1)) * 100) / 100 : base,
        items: [],
        reasoning: '',
      }))
      setSplits(fallback)
      setError('AI split failed — fell back to equal split')
      setStep(4)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (person) => {
    setPaid((prev) => [...prev, person])
    if (splitId) {
      try {
        await splitPay(splitId, person)
        const stored = localStorage.getItem(`split_${splitId}`)
        if (stored) {
          const data = JSON.parse(stored)
          data.paid = [...(data.paid || []), person]
          localStorage.setItem(`split_${splitId}`, JSON.stringify(data))
        }
      } catch {
        // non-critical, UI already updated
      }
    }
  }

  const computedTotal = receiptTotal || items.reduce((s, i) => s + (i.price || 0), 0)

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'var(--dark)' }}>
      <div className="max-w-lg mx-auto flex flex-col gap-6">

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => (step === 0 ? navigate('/dashboard') : setStep((s) => s - 1))}
            style={{
              background: 'transparent',
              border: '1px solid rgba(247,242,236,0.15)',
              color: 'var(--muted)',
              borderRadius: 8,
              padding: '6px 12px',
              cursor: 'pointer',
              fontFamily: 'DM Sans',
              fontSize: 13,
            }}
          >
            ← Back
          </button>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--cream)' }}>
            Split a Receipt 🧾
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i <= step ? '#E8341A' : 'rgba(247,242,236,0.1)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
        <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--muted)', marginTop: -8 }}>
          Step {step + 1} of {STEPS.length}: <strong style={{ color: 'var(--cream)' }}>{STEPS[step]}</strong>
        </p>

        {error && (
          <p style={{ color: '#E8341A', fontFamily: 'DM Sans', fontSize: 13 }}>{error}</p>
        )}

        <AnimatePresence mode="wait">

          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #E8341A',
                  borderRadius: 12,
                  padding: '32px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: preview ? 'transparent' : '#1a1816',
                }}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Receipt preview"
                    style={{ maxHeight: 300, borderRadius: 8, margin: '0 auto', display: 'block' }}
                  />
                ) : (
                  <>
                    <p style={{ fontSize: 40, marginBottom: 8 }}>📸</p>
                    <p style={{ fontFamily: 'DM Sans', fontWeight: 700, color: 'var(--cream)', fontSize: 14 }}>
                      Drop receipt here
                    </p>
                    <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                      JPG or PNG · max 10MB
                    </p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {selectedFile && (
                <button
                  className="btn-primary"
                  onClick={handleExtract}
                  disabled={loading}
                >
                  {loading ? 'Scanning receipt...' : 'Extract Items →'}
                </button>
              )}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-3"
            >
              <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--muted)' }}>
                Review and edit the extracted items.
              </p>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    background: '#1a1816',
                    borderRadius: 8,
                    padding: '8px 12px',
                  }}
                >
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--cream)',
                      fontFamily: 'DM Sans',
                      fontSize: 13,
                      outline: 'none',
                    }}
                    placeholder="Item name"
                  />
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                    style={{
                      width: 70,
                      background: 'transparent',
                      border: 'none',
                      color: '#E8341A',
                      fontFamily: 'DM Sans',
                      fontWeight: 700,
                      fontSize: 13,
                      outline: 'none',
                      textAlign: 'right',
                    }}
                  />
                  <button
                    onClick={() => removeItem(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                onClick={addItem}
                style={{
                  background: 'transparent',
                  border: '1px dashed rgba(247,242,236,0.2)',
                  color: 'var(--muted)',
                  borderRadius: 8,
                  padding: '8px',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans',
                  fontSize: 13,
                }}
              >
                + Add item
              </button>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderTop: '1px solid rgba(247,242,236,0.1)',
                }}
              >
                <span style={{ fontFamily: 'DM Sans', fontWeight: 700, color: 'var(--cream)', fontSize: 14 }}>
                  Total
                </span>
                <span style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#E8341A', fontSize: 14 }}>
                  ${computedTotal.toFixed(2)}
                </span>
              </div>

              <button className="btn-primary" onClick={() => setStep(2)}>
                Looks good →
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--muted)' }}>
                Who's splitting the bill?
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {people.map((p) => (
                  <div
                    key={p}
                    style={{
                      background: '#1a1816',
                      border: '1px solid rgba(232,52,26,0.3)',
                      borderRadius: 20,
                      padding: '5px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--cream)' }}>{p}</span>
                    {p !== 'You' && (
                      <button
                        onClick={() => removePerson(p)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--muted)',
                          cursor: 'pointer',
                          fontSize: 14,
                          lineHeight: 1,
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                  placeholder="Add a name..."
                  style={{
                    flex: 1,
                    background: '#1a1816',
                    border: '1px solid rgba(247,242,236,0.1)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: 'var(--cream)',
                    fontFamily: 'DM Sans',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={addPerson}
                  style={{
                    background: '#E8341A',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 16px',
                    color: 'white',
                    fontFamily: 'DM Sans',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>

              <button
                className="btn-primary"
                onClick={() => setStep(3)}
                disabled={people.length < 1}
              >
                Next →
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-3"
            >
              {[
                {
                  key: 'equal',
                  label: '⚖️ Equal Split',
                  desc: `$${(computedTotal / people.length).toFixed(2)} each (${people.length} people)`,
                },
                {
                  key: 'by_item',
                  label: '🍕 By Item',
                  desc: 'Assign who had what',
                },
                {
                  key: 'ai',
                  label: '🤖 AI Split',
                  desc: 'Claude suggests based on items',
                },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  onClick={() => setSplitMode(key)}
                  style={{
                    border: `2px solid ${splitMode === key ? '#E8341A' : 'rgba(247,242,236,0.1)'}`,
                    borderRadius: 10,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    background: splitMode === key ? 'rgba(232,52,26,0.08)' : '#1a1816',
                    transition: 'all 0.15s',
                  }}
                >
                  <p style={{ fontFamily: 'DM Sans', fontWeight: 700, color: 'var(--cream)', fontSize: 14 }}>
                    {label}
                  </p>
                  <p style={{ fontFamily: 'DM Sans', color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                    {desc}
                  </p>
                </div>
              ))}

              {splitMode === 'by_item' && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                    Assign items to people (unassigned = split equally):
                  </p>
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                        background: '#1a1816',
                        borderRadius: 8,
                        padding: '6px 10px',
                      }}
                    >
                      <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--cream)', flex: 1 }}>
                        {item.name} <span style={{ color: '#E8341A' }}>${item.price.toFixed(2)}</span>
                      </span>
                      <select
                        value={item.assignedTo || ''}
                        onChange={(e) => updateItem(idx, 'assignedTo', e.target.value || null)}
                        style={{
                          background: '#0F0D0C',
                          border: '1px solid rgba(247,242,236,0.1)',
                          borderRadius: 6,
                          color: 'var(--cream)',
                          fontFamily: 'DM Sans',
                          fontSize: 11,
                          padding: '3px 6px',
                          marginLeft: 8,
                        }}
                      >
                        <option value="">Shared</option>
                        {people.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn-primary"
                onClick={handleCalculate}
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                {loading ? 'Calculating...' : 'Calculate Split →'}
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontFamily: 'DM Sans', fontWeight: 700, color: 'var(--cream)', fontSize: 15 }}>
                  💰 Who Owes What
                </p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--muted)' }}>
                  Total: ${computedTotal.toFixed(2)}
                </p>
              </div>

              <SplitSummary splits={splits} paid={paid} onMarkPaid={handleMarkPaid} />

              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(247,242,236,0.15)',
                  color: 'var(--muted)',
                  borderRadius: 8,
                  padding: '10px',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans',
                  fontSize: 13,
                  marginTop: 8,
                }}
              >
                Back to Dashboard
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

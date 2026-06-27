import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AddEntry from './pages/AddEntry'
import EditEntry from './pages/EditEntry'
import AllEntries from './pages/AllEntries'
import Queue from './pages/Queue'
import './App.css'

export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="entries/new" element={<AddEntry />} />
          <Route path="entries/:id/edit" element={<EditEntry />} />
          <Route path="entries" element={<AllEntries />} />
          <Route path="queue" element={<Queue />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

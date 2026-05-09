import Header from './Header'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>{children}</main>
    </div>
  )
}

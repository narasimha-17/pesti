import { Link } from 'react-router-dom'
import { photoCredits } from '../lib/photos'
import { SectionHead } from '../components/ui'

export default function Credits() {
  const rows = Object.entries(photoCredits)
  return (
    <div className="container section">
      <SectionHead eyebrow="Attribution" title="Photo credits" />
      <p className="muted" style={{ marginTop: -12, marginBottom: 24 }}>Photographs are from Wikimedia Commons and used under their Creative Commons or public-domain licences. Thank you to the photographers.</p>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Used for</th><th>File</th><th>Author</th><th>Licence</th></tr></thead>
          <tbody>
            {rows.map(([k, c]) => (
              <tr key={k}>
                <td style={{ textTransform: 'capitalize' }}>{k.replace('-', ' ')}</td>
                <td><a href={c.source} target="_blank" rel="noreferrer noopener" style={{ textDecoration: 'underline' }}>{c.title.replace('File:', '').slice(0, 60)}</a></td>
                <td>{c.author || 'Unknown'}</td>
                <td>{c.license}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 20 }}><Link className="link-arrow" to="/shop">Back to store</Link></p>
    </div>
  )
}

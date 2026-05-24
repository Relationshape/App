import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'

export function RouteErrorFallback() {
  const error = useRouteError()
  const navigate = useNavigate()

  let message = 'An unexpected error occurred.'
  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <section className="page narrow" style={{ paddingTop: 48 }}>
      <div>
        <h1 style={{ marginBottom: 8 }}>Something went wrong</h1>
        <p className="muted">{message}</p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
          Go home
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    </section>
  )
}

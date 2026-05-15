// SHELL-06, D-28. Drain the imperative dialog queue; one Radix Dialog at a time.
import { useDialogQueue } from '@/lib/dialog/dialogQueue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function DialogHost() {
  const queue = useDialogQueue((s) => s.queue)
  const shift = useDialogQueue((s) => s.shift)
  const req = queue[0]
  if (!req) return null
  const close = (v: unknown) => { req.resolve(v as never); shift(req.id) }
  return (
    <Dialog
      key={req.id}
      open={true}
      onOpenChange={(o) => { if (!o && req.dismissable !== false) close(null) }}
    >
      <DialogContent data-testid="dialog-host">
        {req.title && (
          <DialogHeader>
            <DialogTitle>{req.title}</DialogTitle>
          </DialogHeader>
        )}
        <div>{typeof req.body === 'function' ? req.body(close) : req.body}</div>
        <DialogFooter>
          {req.actions.map((a, i) => (
            <Button
              key={i}
              data-testid={`dialog-action-${i}`}
              variant={a.kind === 'primary' ? 'default' : a.kind === 'danger' ? 'destructive' : 'ghost'}
              onClick={() => close(a.value)}
            >
              {a.label}
            </Button>
          ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

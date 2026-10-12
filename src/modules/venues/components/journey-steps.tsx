import { FadeIn } from "@/components/shared/fade-in"
import { OWNER_JOURNEY } from "@/config/journey"

export function JourneySteps() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {OWNER_JOURNEY.map(({ title, description, icon: Icon }, index) => (
        <li key={title} className="min-w-0">
          <FadeIn delay={index} className="h-full">
            <div className="flex h-full flex-col gap-3 bg-muted/60 p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center bg-primary text-primary-foreground">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="text-sm font-medium text-muted-foreground">Step {index + 1}</span>
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </FadeIn>
        </li>
      ))}
    </ol>
  )
}

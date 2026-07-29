import { useParams, useNavigate } from 'react-router'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useContentItem } from '@/hooks/use-content'
import { ContentCard } from '@/components/molecules/content-card'
import { EmptyState } from '@/components/molecules/empty-state'

export default function ContentDetailPage() {
  const { contentId } = useParams<{ contentId: string }>()
  const navigate = useNavigate()
  const { data: item, isLoading, error } = useContentItem(contentId || '')

  if (isLoading) {
    return (
      <div className="max-w-[600px] mx-auto">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="h-6 w-48 bg-bg-tertiary rounded animate-pulse" />
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="max-w-[600px] mx-auto">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-text-primary">Post</h1>
        </div>
        <EmptyState
          icon="🔍"
          title="Post not found"
          description="This post may have been deleted."
        />
      </div>
    )
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">Post</h1>
      </div>
      <div className="p-4">
        <ContentCard item={item} />
      </div>
    </div>
  )
}

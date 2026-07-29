import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { MessageCircle, Heart, Share2, Bookmark } from 'lucide-react';
import type { ContentItem } from '@/types/content';
import { CONTENT_TYPE_LABELS, CONTENT_TYPE_ICONS } from '@/types/content';

interface ContentCardProps {
  item: ContentItem;
  onLike?: () => void;
  onBookmark?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export function ContentCard({ item, onLike, onBookmark, isLiked, isBookmarked }: ContentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-bg-primary border border-border-primary"
    >
      <div className="flex items-center gap-3 mb-3">
        {item.author && (
          <>
            <Link to={`/profile/${item.author.username}`}>
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
                {item.author.avatar ? (
                  <img src={item.author.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-accent font-semibold">{item.author.name[0]}</span>
                )}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${item.author.username}`} className="font-semibold text-text-primary hover:underline">
                {item.author.name}
              </Link>
              <p className="text-xs text-text-secondary">@{item.author.username}</p>
            </div>
          </>
        )}
        {item.space_id && (
          <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">
            {CONTENT_TYPE_ICONS[item.content_type]} {CONTENT_TYPE_LABELS[item.content_type]}
          </span>
        )}
      </div>
      
      <div className="mb-3">
        {item.title && (
          <h3 className="text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
        )}
        <p className="text-text-primary whitespace-pre-wrap">{item.body}</p>
      </div>
      
      {item.media && item.media.length > 0 && (
        <div className="mb-3">
          {item.media.length === 1 ? (
            <div className="rounded-xl overflow-hidden">
              {item.media[0].type === 'image' ? (
                <img src={item.media[0].url} alt="" className="w-full h-auto" />
              ) : item.media[0].type === 'video' ? (
                <video src={item.media[0].url} controls className="w-full h-auto" />
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
              {item.media.slice(0, 4).map((m, i) => (
                <div key={i} className="aspect-square">
                  {m.type === 'image' ? (
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                  ) : m.type === 'video' ? (
                    <video src={m.url} className="w-full h-full object-cover" />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-center gap-4 pt-3 border-t border-border-primary">
        <button
          onClick={onLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            isLiked ? 'text-accent' : 'text-text-secondary hover:text-accent'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span>{item.reaction_count || ''}</span>
        </button>
        <Link
          to={`/content/${item.id}`}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{item.comment_count || ''}</span>
        </Link>
        <button className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
        <button
          onClick={onBookmark}
          className={`ml-auto transition-colors ${
            isBookmarked ? 'text-amber-500' : 'text-text-secondary hover:text-amber-500'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>
    </motion.div>
  );
}
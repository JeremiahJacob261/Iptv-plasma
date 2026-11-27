import { getPosts } from '../lib/precious-blog.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const posts = await getPosts();
    const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
    const published = posts.filter(post => post?.status === 'published' && post.slug && post.title && post.content && (!post.publishedAt || Date.parse(post.publishedAt) <= Date.now()));
    if (slug) {
      const post = published.find(item => item.slug === slug);
      return post ? res.status(200).json({ post }) : res.status(404).json({ error: 'Article not found.' });
    }
    return res.status(200).json({ posts: published.sort((a, b) => Date.parse(b.publishedAt || b.updatedAt) - Date.parse(a.publishedAt || a.updatedAt)) });
  } catch {
    return res.status(503).json({ error: 'The articles are temporarily unavailable.' });
  }
}

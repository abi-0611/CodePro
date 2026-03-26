import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const coursesCollection = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/courses" }),
  schema: z.object({
    title: z.string(),
    shortDescription: z.string(),
    description: z.string().optional(),
    duration: z.string(),
    mode: z.string(),
    level: z.string(),
    price: z.string(),
    badge: z.string().optional(),
    order: z.number().optional(),
    icon: z.string(),
    featured: z.boolean().optional(),
    category: z.string(),
    curriculum: z.array(z.string()),
  }),
});

export const collections = {
  'courses': coursesCollection,
};

import { Request, Response } from 'express';
import { Domain } from '../models/Domain';

export const getAllDomains = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const filter: any = {};
    if (category) {
      filter.category = category;
    }
    const domains = await Domain.find(filter).sort({ name: 1 });
    res.json({ domains });
  } catch (error) {
    console.error('[Get Domains Error]', error);
    res.status(500).json({ message: 'Failed to fetch domains' });
  }
};

export const getDomainBySlug = async (req: Request, res: Response): Promise<any> => {
  try {
    const slug = req.params.slug as string;
    const domain = await Domain.findOne({ slug: slug.toLowerCase() });
    if (!domain) {
      return res.status(404).json({ message: 'Domain not found' });
    }
    res.json({ domain });
  } catch (error) {
    console.error('[Get Domain Slug Error]', error);
    res.status(500).json({ message: 'Failed to fetch domain details' });
  }
};

import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { escapeRegex } from '../utils/securityUtils';

export const getAllProjects = async (req: Request, res: Response): Promise<any> => {
  try {
    const { search, difficulty, tag, category, domain, sort } = req.query;

    const query: any = {};

    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }

    if (tag && tag !== 'All') {
      query.tags = tag;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (domain) {
      query.domainSlug = (domain as string).toLowerCase();
    }

    if (search && typeof search === 'string') {
      // Escape user input before building a RegExp so search cannot be used for
      // catastrophic backtracking or to inject regex operators (SEC-09).
      const safeTerm = escapeRegex(search.trim().slice(0, 100));
      if (safeTerm.length > 0) {
        const searchRegex = new RegExp(safeTerm, 'i');
        query.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { problemStatement: searchRegex },
          { technologies: searchRegex },
          { skills: searchRegex },
          { tags: searchRegex },
        ];
      }
    }

    let sortOptions: any = { createdAt: -1 }; // default: new

    if (sort === 'popularity') {
      sortOptions = { popularity: -1 };
    } else if (sort === 'recommended') {
      sortOptions = { featured: -1, popularity: -1 };
    } else if (sort === 'difficulty') {
      // In difficulty sort, beginner -> intermediate -> advanced
      sortOptions = { difficulty: 1 };
    } else if (sort === 'new') {
      sortOptions = { createdAt: -1 };
    }

    const projects = await Project.find(query).sort(sortOptions);
    res.json({ count: projects.length, projects });
  } catch (error) {
    console.error('[Get Projects Error]', error);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

export const getProjectByIdOrSlug = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    let project = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      project = await Project.findById(id);
    }

    if (!project) {
      project = await Project.findOne({ slug: id.toLowerCase() });
    }

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    console.error('[Get Project Detail Error]', error);
    res.status(500).json({ message: 'Failed to fetch project details' });
  }
};

export const getProjectsByDomain = async (req: Request, res: Response): Promise<any> => {
  try {
    const domainIdentifier = (req.params.domainId || req.params.slug) as string;
    const projects = await Project.find({
      domainSlug: domainIdentifier.toLowerCase()
    }).sort({ featured: -1, popularity: -1 });

    res.json({ count: projects.length, projects });
  } catch (error) {
    console.error('[Get Domain Projects Error]', error);
    res.status(500).json({ message: 'Failed to fetch projects for this domain' });
  }
};

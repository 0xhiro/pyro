import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';

export const validateBurnBody = (req: Request, res: Response, next: NextFunction) => {
  const { creatorMint, wallet, amount } = req.body;

  if (!creatorMint || typeof creatorMint !== 'string') {
    return res.status(400).json({ error: 'creatorMint is required and must be a string' });
  }

  if (!wallet || typeof wallet !== 'string') {
    return res.status(400).json({ error: 'wallet is required and must be a string' });
  }

  if (amount === undefined || amount === null) {
    return res.status(400).json({ error: 'amount is required' });
  }

  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  // Add parsed amount to request
  req.body.amount = numAmount;
  next();
};

export const validateObjectId = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: `Invalid ${paramName} format` });
    }
    next();
  };
};

export const validateCreatorBody = (req: Request, res: Response, next: NextFunction) => {
  const { mint, name } = req.body;

  if (!mint || typeof mint !== 'string') {
    return res.status(400).json({ error: 'mint is required and must be a string' });
  }

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required and must be a string' });
  }

  next();
};

export const validateSessionStart = (req: Request, res: Response, next: NextFunction) => {
  const { creatorMint } = req.body;

  if (!creatorMint || typeof creatorMint !== 'string') {
    return res.status(400).json({ error: 'creatorMint is required and must be a string' });
  }

  next();
};
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface PointProduct {
  id: string;
  name: string;
  points: number;
  price: number;
  isRecommended: boolean;
  isActive: boolean;
  androidProductId: string;
  iosProductId: string;
  order: number;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const INITIAL_POINT_PRODUCTS: PointProduct[] = [
  {
    id: 'point-1',
    name: '1,000 온 충전',
    points: 1000,
    price: 1100,
    isRecommended: false,
    isActive: true,
    androidProductId: 'com.tokfriends.point.1000',
    iosProductId: 'tokfriends.point.1000',
    order: 1,
  },
  {
    id: 'point-2',
    name: '5,000 온 충전 (인기)',
    points: 5000,
    price: 5500,
    isRecommended: true,
    isActive: true,
    androidProductId: 'com.tokfriends.point.5000',
    iosProductId: 'tokfriends.point.5000',
    order: 2,
  },
  {
    id: 'point-3',
    name: '10,000 온 충전',
    points: 10000,
    price: 11000,
    isRecommended: false,
    isActive: true,
    androidProductId: 'com.tokfriends.point.10000',
    iosProductId: 'tokfriends.point.10000',
    order: 3,
  },
  {
    id: 'point-4',
    name: '30,000 온 충전 (보너스 +10%)',
    points: 33000,
    price: 33000,
    isRecommended: true,
    isActive: true,
    androidProductId: 'com.tokfriends.point.30000',
    iosProductId: 'tokfriends.point.30000',
    order: 4,
  },
  {
    id: 'point-5',
    name: '50,000 온 충전 (보너스 +15%)',
    points: 57500,
    price: 55000,
    isRecommended: false,
    isActive: true,
    androidProductId: 'com.tokfriends.point.50000',
    iosProductId: 'tokfriends.point.50000',
    order: 5,
  },
  {
    id: 'point-6',
    name: '100,000 온 충전 (VIP 보너스 +20%)',
    points: 120000,
    price: 110000,
    isRecommended: false,
    isActive: true,
    androidProductId: 'com.tokfriends.point.100000',
    iosProductId: 'tokfriends.point.100000',
    order: 6,
  },
];

@Injectable()
export class StoreService implements OnModuleInit {
  private readonly logger = new Logger(StoreService.name);
  private products: PointProduct[] = [];
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly dataFilePath = path.join(this.dataDir, 'point-products.json');

  async onModuleInit() {
    this.loadPersistedProducts();
  }

  private loadPersistedProducts() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.products = parsed;
          this.logger.log(`Loaded ${this.products.length} point products from disk.`);
          return;
        }
      }

      this.products = [...INITIAL_POINT_PRODUCTS];
      this.savePersistedProducts();
      this.logger.log(`Initialized and saved ${this.products.length} default point products.`);
    } catch (err: any) {
      this.logger.warn(`Failed to read point products from disk: ${err?.message}, using defaults.`);
      this.products = [...INITIAL_POINT_PRODUCTS];
    }
  }

  private savePersistedProducts() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.dataFilePath, JSON.stringify(this.products, null, 2), 'utf-8');
    } catch (err: any) {
      this.logger.error(`Failed to save point products to disk: ${err?.message}`);
    }
  }

  async listAll(): Promise<PointProduct[]> {
    return [...this.products].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  async create(payload: Partial<PointProduct>): Promise<PointProduct> {
    const id = `point-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const nextOrder = (this.products[this.products.length - 1]?.order ?? this.products.length) + 1;

    const newProduct: PointProduct = {
      id,
      name: payload.name?.trim() || '신규 온(ON) 충전 상품',
      points: Number(payload.points ?? 1000),
      price: Number(payload.price ?? 1100),
      isRecommended: Boolean(payload.isRecommended),
      isActive: payload.isActive !== false,
      androidProductId: payload.androidProductId?.trim() || `com.tokfriends.point.${payload.points ?? 1000}`,
      iosProductId: payload.iosProductId?.trim() || `tokfriends.point.${payload.points ?? 1000}`,
      order: Number(payload.order ?? nextOrder),
      note: payload.note?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.products.push(newProduct);
    this.savePersistedProducts();
    this.logger.log(`Created point product: ${newProduct.name} (${newProduct.id})`);
    return newProduct;
  }

  async update(id: string, payload: Partial<PointProduct>): Promise<PointProduct> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`상품 ID ${id}를 찾을 수 없습니다.`);
    }

    const current = this.products[index];
    const updated: PointProduct = {
      ...current,
      ...payload,
      id: current.id,
      points: payload.points !== undefined ? Number(payload.points) : current.points,
      price: payload.price !== undefined ? Number(payload.price) : current.price,
      order: payload.order !== undefined ? Number(payload.order) : current.order,
      isRecommended: payload.isRecommended !== undefined ? Boolean(payload.isRecommended) : current.isRecommended,
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : current.isActive,
      updatedAt: new Date().toISOString(),
    };

    this.products[index] = updated;
    this.savePersistedProducts();
    this.logger.log(`Updated point product: ${updated.name} (${updated.id})`);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index !== -1) {
      const removed = this.products.splice(index, 1);
      this.savePersistedProducts();
      this.logger.log(`Deleted point product: ${removed[0]?.name} (${id})`);
    }
    return true;
  }

  async reorder(items: { id: string; order: number }[]): Promise<boolean> {
    const orderMap = new Map<string, number>();
    items.forEach((item) => orderMap.set(item.id, item.order));

    this.products = this.products.map((product) => {
      if (orderMap.has(product.id)) {
        return { ...product, order: orderMap.get(product.id)! };
      }
      return product;
    });

    this.products.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    this.savePersistedProducts();
    this.logger.log(`Reordered ${items.length} point products.`);
    return true;
  }
}

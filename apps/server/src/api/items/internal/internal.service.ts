import { PrismaService } from "@app/db";
import { Injectable } from "@nestjs/common";
import { ItemsArgs, UpdateItemsArgs } from "./internal.dto";
import { Context, getUserFromContext } from "@app/common";

@Injectable()
export class ItemsInternalService {
    constructor(
        private readonly db: PrismaService
    ) { }

    async createItems(args: ItemsArgs, ctx: Context) {
        const user = getUserFromContext(ctx);

        if (!user) {
            throw new Error('User not found');
        }

        if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
            throw new Error('Only teachers and admins can create items');
        }

        const item = await this.db.item.create({
            data: {
                name: args.name,
                description: args.description,
                price: args.price,
                effectValue: args.effectValue ?? 0,
                type: args.type,
            },
        });

        return item
    }

    async updateItems(args: UpdateItemsArgs, ctx: Context) {
        const user = getUserFromContext(ctx);

        if (!user) {
            throw new Error('User not found');
        }

        if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
            throw new Error('Only teachers and admins can update items');
        }

        const item = await this.db.item.update({
            where: { id: args.id },
            data: {
                name: args.name,
                description: args.description,
                price: args.price,
                effectValue: args.effectValue ?? 0,
                type: args.type,
            },
        })

        return item
    }

    async deleteItems(args: { id: string }, ctx: Context) {
        const user = getUserFromContext(ctx);

        if (!user) {
            throw new Error('User not found');
        }

        if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
            throw new Error('Only teachers and admins can delete items');
        }

        await this.db.item.delete({
            where: { id: args.id },
        });
    }

    async getItems(args: { id: string }, ctx: Context) {
        const user = getUserFromContext(ctx);
        if (!user) throw new Error('User not found');

        const item = await this.db.item.findUnique({
            where: { id: args.id },
        });

        if (!item) {
            throw new Error('Item not found');
        }

        return item;
    }

    async getAllItems(ctx: Context) {
        const user = getUserFromContext(ctx);
        if (!user) throw new Error('User not found');

        const items = await this.db.item.findMany();

        return items;
    }
}
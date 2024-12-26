import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionService {
  constructor(private prisma: PrismaService) {}

  // Crear una nueva colección
  async create(createCollectionDto: CreateCollectionDto) {
    const { productIds, ...collectionData } = createCollectionDto;

    return this.prisma.collection.create({
      data: {
        ...collectionData,
        products: productIds
          ? {
              connect: productIds.map((id) => ({ id })), // Conectar productos existentes por ID
            }
          : undefined,
      },
      include: {
        products: true, // Incluir los productos asociados
      },
    });
  }

  // Obtener todas las colecciones
  async findAll() {
    return this.prisma.collection.findMany({
      include: {
        products: true, // Incluir los productos asociados
      },
    });
  }

  // Obtener una colección por ID
  async findOne(id: string) {
    return this.prisma.collection.findUnique({
      where: { id },
      include: {
        products: true, // Incluir los productos asociados
      },
    });
  }

  // Actualizar una colección
  async update(id: string, updateCollectionDto: UpdateCollectionDto) {
    const { productIds, ...collectionData } = updateCollectionDto;

    return this.prisma.collection.update({
      where: { id },
      data: {
        ...collectionData,
        products: productIds
          ? {
              set: productIds.map((id) => ({ id })), // Actualizar las asociaciones
            }
          : undefined,
      },
      include: {
        products: true, // Incluir los productos asociados
      },
    });
  }

  // Eliminar una colección
  async remove(id: string) {
    return this.prisma.collection.delete({
      where: { id },
    });
  }
}

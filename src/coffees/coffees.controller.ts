import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CoffeesService } from './coffees.service';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';
import { Auth,} from '../iam/authentication/decorators/auth.decorator';
import { AuthType } from '../iam/authentication/enums/auth-type.enum';
// import { Policies } from '../iam/authorization/decorators/policies.decorator';
// import { GmailEmailPolicy } from 'src/iam/authorization/policies/gmail-email.policy';
// import { Permission } from '../iam/authorization/permission.type';
// import { Permissions } from '../iam/authorization/decorators/permissions.decorator';
// import { Roles } from '../iam/authorization/decorators/roles.decorator';
// import { Role } from '../users/enums/role.enum';

@ApiTags('Coffees')
@Controller('coffees')
@Auth(AuthType.ApiKey, AuthType.Bearer)
export class CoffeesController {
  constructor(private readonly coffeesService: CoffeesService) {}

  @Post()
  // @Roles(Role.Admin)
  // @Permissions(Permission.CreateCoffee)
  // @Policies(new GmailEmailPolicy())
  create(@Body() createCoffeeDto: CreateCoffeeDto) {
    return this.coffeesService.create(createCoffeeDto);
  }

  @Get()
  findAll() {
    return this.coffeesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coffeesService.findOne(+id);
  }

  @Patch(':id')
  // @Roles(Role.Admin)
  // @Permissions(Permission.UpdateCoffee)
  update(@Param('id') id: string, @Body() updateCoffeeDto: UpdateCoffeeDto) {
    return this.coffeesService.update(+id, updateCoffeeDto);
  }

  @Delete(':id')
  // @Roles(Role.Admin)
  // @Permissions(Permission.DeleteCoffee)
  remove(@Param('id') id: string) {
    return this.coffeesService.remove(+id);
  }
}

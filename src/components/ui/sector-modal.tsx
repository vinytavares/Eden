import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const defaultProducts = [
  "🥬 Alface",
  "🥗 Rúcula",
  "🌿 Almeirão",
  "🍃 Beterraba em folha",
  "🥔 Beterraba",
  "🌱 Rabanete",
  "🌾 Cebolinha",
  "🌿 Salsinha",
  "🍅 Tomate",
  "🥕 Cenoura",
  "🥬 Couve",
  "🥒 Pepino",
  "🫑 Pimentão",
  "🍆 Abobrinha",
  "🥦 Brócolis",
  "🥬 Repolho",
  "🌱 Espinafre",
  "🌽 Milho verde",
  "🫘 Feijão vagem",
  "🍓 Morango",
];

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  plantingDate: z.date({
    required_error: "Data do plantio é obrigatória",
  }).refine((date) => date <= new Date(), {
    message: "Data do plantio não pode ser futura",
  }),
  harvestForecast: z.date({
    required_error: "Previsão de colheita é obrigatória",
  }),
  product: z.string().min(1, "Produto é obrigatório"),
  sensors: z.array(z.number()).min(1, "Pelo menos um sensor deve ser selecionado"),
  amount: z.number().min(1, "Quantidade deve ser maior que 0"),
  repetitionTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:mm)"),
  observations: z.string().optional(),
  harvestStatus: z.enum(["growing", "maturing", "ready", "overdue", "harvested"]),
  plantedSeedlings: z.number().min(0, "Quantidade de mudas plantadas deve ser maior ou igual a 0"),
  harvestedSeedlings: z.number().min(0, "Quantidade de mudas colhidas deve ser maior ou igual a 0"),
});

export type SectorFormData = z.infer<typeof formSchema>;

interface SectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SectorFormData) => void;
  initialData?: Partial<SectorFormData>;
  viewMode?: boolean;
  irrigationHistory?: Array<{
    date: string;
    duration: string;
    volume: string;
    sector: string;
    product: string;
  }>;
}

export function SectorModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  viewMode = false,
  irrigationHistory = [],
}: SectorModalProps) {
  const [products, setProducts] = useState(defaultProducts);
  const [showNewProductInput, setShowNewProductInput] = useState(false);
  const [newProduct, setNewProduct] = useState("");

  const form = useForm<SectorFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      product: "",
      sensors: [],
      amount: 0,
      repetitionTime: "08:00",
      observations: "",
      harvestStatus: "growing" as const,
      harvestForecast: new Date(),
      plantedSeedlings: 0,
      harvestedSeedlings: 0,
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const handleSubmit = (data: SectorFormData) => {
    onSubmit(data);
    onOpenChange(false);
    form.reset();
  };

  const handleAddNewProduct = () => {
    if (newProduct.trim()) {
      setProducts(prev => [...prev, newProduct.trim()]);
      form.setValue("product", newProduct.trim());
      setNewProduct("");
      setShowNewProductInput(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-roboto">
            {viewMode ? "Visualizar Setor" : initialData ? "Editar Setor" : "Novo Setor de Plantio"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                  <FormItem>
                   <FormLabel className="font-lato font-medium">Título do setor</FormLabel>
                   <FormControl>
                     <Input placeholder="Ex: Setor 1 - Horta A" {...field} disabled={viewMode} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plantingDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="font-lato font-medium">Data do plantio</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="harvestForecast"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="font-lato font-medium">Previsão de colheita</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={viewMode}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-lato font-medium">Produto plantado</FormLabel>
                  <div className="space-y-2">
                    <Select onValueChange={field.onChange} value={field.value} disabled={viewMode}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue placeholder="Selecione o produto" />
                         </SelectTrigger>
                       </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product} value={product}>
                            {product}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {!showNewProductInput && !viewMode ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewProductInput(true)}
                        className="w-full gap-2"
                      >
                        <Plus size={14} />
                        Novo produto
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome do novo produto"
                          value={newProduct}
                          onChange={(e) => setNewProduct(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleAddNewProduct()}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddNewProduct}
                        >
                          Adicionar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowNewProductInput(false);
                            setNewProduct("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sensors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-lato font-medium">Sensores do plantio</FormLabel>
                   <FormControl>
                     <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                       <div className="grid grid-cols-5 gap-2">
                         {Array.from({ length: 100 }, (_, i) => i + 1).map((sensorNum) => (
                           <label
                             key={sensorNum}
                             className="flex items-center space-x-2 cursor-pointer"
                           >
                             <input
                               type="checkbox"
                               checked={field.value.includes(sensorNum)}
                               disabled={viewMode}
                               onChange={(e) => {
                                 if (e.target.checked) {
                                   field.onChange([...field.value, sensorNum]);
                                 } else {
                                   field.onChange(field.value.filter((s: number) => s !== sensorNum));
                                 }
                               }}
                               className="rounded"
                             />
                             <span className="text-sm">{sensorNum}</span>
                           </label>
                         ))}
                       </div>
                     </div>
                   </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-lato font-medium">Quantidade (ml)</FormLabel>
                   <FormControl>
                     <Input 
                       type="number" 
                       min="1"
                       placeholder="250"
                       {...field}
                       disabled={viewMode}
                       onChange={(e) => field.onChange(Number(e.target.value))}
                     />
                   </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="repetitionTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-lato font-medium">Repetir a cada</FormLabel>
                   <FormControl>
                     <Input 
                       type="time"
                       {...field}
                       disabled={viewMode}
                     />
                   </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="harvestStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-lato font-medium">Status da colheita</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value} disabled={viewMode}>
                     <FormControl>
                       <SelectTrigger>
                         <SelectValue placeholder="Selecione o status" />
                       </SelectTrigger>
                     </FormControl>
                    <SelectContent>
                      <SelectItem value="growing">🌱 Crescimento</SelectItem>
                      <SelectItem value="maturing">🌿 Maturação</SelectItem>
                      <SelectItem value="ready">✅ Pronto para colher</SelectItem>
                      <SelectItem value="overdue">⌛ Atrasado</SelectItem>
                      <SelectItem value="harvested">🧺 Colhido</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="plantedSeedlings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-lato font-medium">Mudas plantadas</FormLabel>
                     <FormControl>
                       <Input 
                         type="number" 
                         min="0"
                         placeholder="150"
                         {...field}
                         disabled={viewMode}
                         onChange={(e) => field.onChange(Number(e.target.value))}
                       />
                     </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
                control={form.control}
                name="harvestedSeedlings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-lato font-medium">Mudas colhidas</FormLabel>
                     <FormControl>
                       <Input 
                         type="number" 
                         min="0"
                         placeholder="0"
                         {...field}
                         disabled={viewMode}
                         onChange={(e) => field.onChange(Number(e.target.value))}
                       />
                     </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-lato font-medium">Observações (opcional)</FormLabel>
                   <FormControl>
                     <Textarea 
                       placeholder="Observações sobre o setor..."
                       {...field} 
                       disabled={viewMode}
                     />
                   </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {irrigationHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-roboto">
                    Histórico de Irrigações (últimas 3)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {irrigationHistory.slice(0, 3).map((entry, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-secondary/30 rounded text-sm space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-lato font-medium">{entry.date}</p>
                          <p className="text-xs text-muted-foreground">{entry.sector}</p>
                          <p className="text-xs text-muted-foreground">{entry.product}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-roboto font-bold text-eden-blue">{entry.volume}</p>
                          <p className="text-xs text-muted-foreground">{entry.duration}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

             <div className="flex gap-3 pt-4">
               {viewMode ? (
                 <Button
                   type="button"
                   variant="outline"
                   className="flex-1"
                   onClick={() => onOpenChange(false)}
                 >
                   Fechar
                 </Button>
               ) : (
                 <>
                   <Button
                     type="button"
                     variant="outline"
                     className="flex-1"
                     onClick={() => onOpenChange(false)}
                   >
                     Cancelar
                   </Button>
                   <Button type="submit" className="flex-1">
                     {initialData ? "Salvar Alterações" : "Criar Setor"}
                   </Button>
                 </>
               )}
             </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
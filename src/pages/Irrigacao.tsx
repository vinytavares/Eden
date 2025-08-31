import { useState, useEffect } from "react";
import { Droplets, Zap, Clock, History, AlertTriangle, Play, Square, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useSpeech } from "@/hooks/use-speech";
import { SectorCard } from "@/components/ui/sector-card";
import { SectorModal, type SectorFormData } from "@/components/ui/sector-modal";

type HarvestStatus = "growing" | "maturing" | "ready" | "overdue" | "harvested";

interface Sector {
  id: string;
  title: string;
  product: string;
  repetitionInterval: string;
  isIrrigating: boolean;
  isAutomatic: boolean;
  plantingDate: Date;
  sensors: number[];
  amount: number;
  repetitionTime: string;
  observations: string;
  harvestStatus: HarvestStatus;
  harvestForecast: Date;
  lastIrrigation?: Date;
  remainingTime?: number;
  plantedSeedlings?: number;
  harvestedSeedlings?: number;
}

const Irrigacao = () => {
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isIrrigating, setIsIrrigating] = useState(false);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [editingSector, setEditingSector] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([
    {
      id: "1",
      title: "Setor 1 - Horta A",
      product: "Alface",
      repetitionInterval: "08:00",
      isIrrigating: false,
      isAutomatic: true,
      plantingDate: new Date("2024-01-15"),
      sensors: [1, 2],
      amount: 250,
      repetitionTime: "08:00",
      observations: "Setor principal da horta",
      harvestStatus: "growing" as const,
      harvestForecast: new Date("2024-03-15"),
      plantedSeedlings: 150,
      harvestedSeedlings: 0,
    },
    {
      id: "2", 
      title: "Setor 2 - Horta B",
      product: "Tomate",
      repetitionInterval: "12:00",
      isIrrigating: false,
      isAutomatic: false,
      plantingDate: new Date("2024-01-20"),
      sensors: [3, 4],
      amount: 400,
      repetitionTime: "12:00",
      observations: "",
      harvestStatus: "maturing" as const,
      harvestForecast: new Date("2024-05-20"),
      plantedSeedlings: 200,
      harvestedSeedlings: 0,
    },
  ]);
  const { speak } = useSpeech();

  // Timer effect for irrigation countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setSectors(prev => prev.map(sector => {
        if (sector.isIrrigating && sector.lastIrrigation && sector.remainingTime !== undefined) {
          const newRemainingTime = sector.remainingTime - 1;
          if (newRemainingTime <= 0) {
            speak(`Irrigação do ${sector.title} concluída`);
            return { ...sector, isIrrigating: false, remainingTime: undefined };
          }
          return { ...sector, remainingTime: newRemainingTime };
        }
        return sector;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [speak]);

  const handleManualIrrigation = () => {
    const newState = !isIrrigating;
    setIsIrrigating(newState);
    speak(newState ? "Iniciando irrigação agora" : "Parando irrigação");
  };

  const handleModeChange = (checked: boolean) => {
    setIsAutoMode(checked);
    speak(checked ? "Modo automático ativado" : "Modo manual ativado");
  };

  const handleStopIrrigation = () => {
    setIsIrrigating(false);
    speak("Parando irrigação");
  };

  const handleScheduleIrrigation = () => {
    speak("Abrindo agendamento de irrigação");
    // TODO: Implementar modal de agendamento
  };

  const handleSectorEdit = (sectorId: string) => {
    setEditingSector(sectorId);
    setShowSectorModal(true);
  };

  const handleSectorIrrigate = (sectorId: string) => {
    setSectors(prev => prev.map(sector => {
      if (sector.id === sectorId) {
        const [hours, minutes] = sector.repetitionTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;
        return { 
          ...sector, 
          isIrrigating: true,
          lastIrrigation: new Date(),
          remainingTime: totalMinutes * 60 // Convert to seconds for countdown
        };
      }
      return sector;
    }));
    speak(`Iniciando irrigação do setor ${sectorId}`);
  };

  const handleSectorStop = (sectorId: string) => {
    setSectors(prev => prev.map(sector => 
      sector.id === sectorId 
        ? { ...sector, isIrrigating: false, remainingTime: undefined }
        : sector
    ));
    speak(`Parando irrigação do setor ${sectorId}`);
  };

  const handleSectorView = (sectorId: string) => {
    setEditingSector(sectorId);
    setViewMode(true);
    setShowSectorModal(true);
  };

  const handleToggleAutomatic = (sectorId: string) => {
    setSectors(prev => prev.map(sector => 
      sector.id === sectorId 
        ? { ...sector, isAutomatic: !sector.isAutomatic }
        : sector
    ));
    const sector = sectors.find(s => s.id === sectorId);
    speak(`Modo automático ${sector?.isAutomatic ? 'desativado' : 'ativado'} para ${sector?.title}`);
  };

  const handleHarvestStatusChange = (sectorId: string, newStatus: HarvestStatus) => {
    setSectors(prev => prev.map(sector => 
      sector.id === sectorId 
        ? { ...sector, harvestStatus: newStatus }
        : sector
    ));
    const sector = sectors.find(s => s.id === sectorId);
    speak(`Status da colheita alterado para ${newStatus} em ${sector?.title}`);
  };

  const handleSectorSubmit = (data: SectorFormData) => {
    if (editingSector) {
      setSectors(prev => prev.map(sector => 
        sector.id === editingSector 
          ? { 
              ...sector,
              title: data.title,
              product: data.product,
              repetitionInterval: data.repetitionTime,
              plantingDate: data.plantingDate,
              sensors: data.sensors,
              amount: data.amount,
              repetitionTime: data.repetitionTime,
              observations: data.observations || "",
              harvestStatus: data.harvestStatus,
              harvestForecast: data.harvestForecast,
              plantedSeedlings: data.plantedSeedlings,
              harvestedSeedlings: data.harvestedSeedlings,
            }
          : sector
      ));
      speak("Setor atualizado com sucesso");
    } else {
      const newSector = {
        id: Date.now().toString(),
        title: data.title,
        product: data.product,
        repetitionInterval: data.repetitionTime,
        isIrrigating: false,
        isAutomatic: true,
        plantingDate: data.plantingDate,
        sensors: data.sensors,
        amount: data.amount,
        repetitionTime: data.repetitionTime,
        observations: data.observations || "",
        harvestStatus: data.harvestStatus,
        harvestForecast: data.harvestForecast,
        plantedSeedlings: data.plantedSeedlings,
        harvestedSeedlings: data.harvestedSeedlings,
      };
      setSectors(prev => [...prev, newSector]);
      speak("Novo setor criado com sucesso");
    }
    
    setEditingSector(null);
    setViewMode(false);
  };

  const getEditingData = () => {
    if (!editingSector) return undefined;
    const sector = sectors.find(s => s.id === editingSector);
    if (!sector) return undefined;
    
    return {
      title: sector.title,
      product: sector.product,
      plantingDate: sector.plantingDate,
      sensors: sector.sensors,
      amount: sector.amount,
      repetitionTime: sector.repetitionTime,
      observations: sector.observations,
      harvestStatus: sector.harvestStatus,
      harvestForecast: sector.harvestForecast,
      plantedSeedlings: sector.plantedSeedlings || 0,
      harvestedSeedlings: sector.harvestedSeedlings || 0,
    };
  };

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-roboto font-bold text-primary mb-2 flex items-center gap-2">
          <Droplets className="text-eden-blue" />
          Irrigação Inteligente
        </h1>
        <p className="text-muted-foreground font-lato">
          Controle sua irrigação de forma simples e eficiente
        </p>
      </div>



      {/* Alerts */}
      <Card className="mb-6 shadow-card border-eden-orange/20 bg-eden-orange/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-eden-orange" size={20} />
            <div>
              <h3 className="font-roboto font-bold text-eden-orange">Atenção</h3>
              <p className="text-sm font-lato text-foreground/80">
                Umidade do solo está baixa. Considere irrigar em breve.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setores de Plantio */}
      <Card className="mb-6 shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-roboto">
              <Droplets size={20} className="text-eden-green" />
              Setores de Plantio
            </CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setEditingSector(null);
                setViewMode(false);
                setShowSectorModal(true);
              }}
              className="gap-1"
            >
              <Plus size={14} />
              Novo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sectors.map((sector) => (
              <SectorCard
                key={sector.id}
                id={sector.id}
                title={sector.title}
                product={sector.product}
                repetitionInterval={sector.repetitionInterval}
                isIrrigating={sector.isIrrigating}
                isAutomatic={sector.isAutomatic}
                harvestStatus={sector.harvestStatus}
                harvestForecast={sector.harvestForecast}
                remainingTime={sector.remainingTime}
                sensors={sector.sensors}
                plantedSeedlings={sector.plantedSeedlings}
                harvestedSeedlings={sector.harvestedSeedlings}
                onEdit={handleSectorEdit}
                onIrrigate={handleSectorIrrigate}
                onStop={handleSectorStop}
                onView={handleSectorView}
                onToggleAutomatic={handleToggleAutomatic}
                onHarvestStatusChange={handleHarvestStatusChange}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick History */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-roboto">
            <History size={20} />
            Histórico Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {[
              { 
                time: "06:00", 
                duration: "15 min", 
                amount: "250ml",
                sector: "Setor 1 - Horta A",
                product: "🥬 Alface"
              },
              { 
                time: "Ontem 18:00", 
                duration: "20 min", 
                amount: "320ml",
                sector: "Setor 2 - Horta B", 
                product: "🍅 Tomate"
              },
              { 
                time: "Ontem 06:00", 
                duration: "15 min", 
                amount: "240ml",
                sector: "Setor 1 - Horta A",
                product: "🥬 Alface"
              },
            ].map((entry, index) => (
              <Card key={index} className="bg-secondary/30">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-lato font-medium">{entry.time}</p>
                        <p className="text-sm text-muted-foreground">{entry.sector}</p>
                        <p className="text-sm text-muted-foreground">{entry.product}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-roboto font-bold text-eden-blue">{entry.amount}</p>
                        <p className="text-sm text-muted-foreground">{entry.duration}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sector Modal */}
      <SectorModal
        open={showSectorModal}
        onOpenChange={(open) => {
          setShowSectorModal(open);
          if (!open) {
            setViewMode(false);
            setEditingSector(null);
          }
        }}
        onSubmit={handleSectorSubmit}
        initialData={getEditingData()}
        viewMode={viewMode}
        irrigationHistory={[
          { 
            date: "29/08 - 06:00", 
            duration: "15 min", 
            volume: "250ml",
            sector: "Setor 1 - Horta A",
            product: "🥬 Alface"
          },
          { 
            date: "28/08 - 18:00", 
            duration: "20 min", 
            volume: "320ml",
            sector: "Setor 2 - Horta B",
            product: "🍅 Tomate"
          },
          { 
            date: "28/08 - 06:00", 
            duration: "15 min", 
            volume: "240ml",
            sector: "Setor 1 - Horta A",
            product: "🥬 Alface"
          },
        ]}
      />
    </div>
  );
};

export default Irrigacao;